import {
  AuthConnectionsResponse,
  AuthConnectionsResponseSchema,
  AuthResponse,
  AuthResponseSchema,
  DeleteMeResponse,
  DeleteMeResponseSchema,
  EmailVerificationConfirmResponse,
  EmailVerificationConfirmResponseSchema,
  EmailVerificationIssueResponse,
  EmailVerificationIssueResponseSchema,
  MeResponse,
  MeResponseSchema,
  PasswordResetConfirmResponse,
  PasswordResetConfirmResponseSchema,
  PasswordResetIssueResponse,
  PasswordResetIssueResponseSchema,
  UpdateMeResponse,
  UpdateMeResponseSchema,
} from '@kichulbot/api-contract/auth';
import { generateRandomNickname } from '@kichulbot/utils';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';

import {
  OAuthProvider,
  Prisma,
  User,
  UserAuthType,
} from '../../infrastructure/database/prisma-client';
import { serializeUser } from './auth.serializer';
import { AuthMailerService } from './auth-mailer.service';
import {
  ConfirmEmailVerificationDto,
  EmailVerificationDto,
  KakaoOAuthProfileDto,
  LoginDto,
  PasswordResetConfirmDto,
  PasswordResetDto,
  RegisterDto,
  UpdateMeDto,
} from './dto/auth.dto';
import { JwtUser } from './types';
import { UsersRepository } from './users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authMailerService: AuthMailerService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(
      this.normalizeEmail(dto.email),
    );

    if (!user?.passwordHash || user.authType !== UserAuthType.EMAIL) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return this.toAuthResponse(user);
  }

  async requestPasswordReset(
    dto: PasswordResetDto,
  ): Promise<PasswordResetIssueResponse> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersRepository.findByEmail(email);

    if (!user || user.authType !== UserAuthType.EMAIL || !user.passwordHash) {
      return PasswordResetIssueResponseSchema.parse({ ok: true });
    }

    const token = this.generatePasswordResetToken();
    await this.usersRepository.expirePasswordResetTokens(user.id);
    await this.usersRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash: this.hashPasswordResetToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    await this.authMailerService.sendPasswordResetLink(
      email,
      this.passwordResetUrl(token),
    );

    return PasswordResetIssueResponseSchema.parse({
      ok: true,
    });
  }

  async confirmPasswordReset(
    dto: PasswordResetConfirmDto,
  ): Promise<PasswordResetConfirmResponse> {
    const resetToken = await this.usersRepository.findUsablePasswordResetToken(
      this.hashPasswordResetToken(dto.token),
    );

    if (
      !resetToken ||
      resetToken.user.authType !== UserAuthType.EMAIL ||
      !resetToken.user.email
    ) {
      throw new BadRequestException(
        '비밀번호 재설정 링크가 유효하지 않습니다.',
      );
    }

    await this.usersRepository.updatePassword(
      resetToken.userId,
      await this.hashPassword(dto.password),
    );
    await this.usersRepository.markPasswordResetTokenUsed(resetToken.id);

    return PasswordResetConfirmResponseSchema.parse({ ok: true });
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);
    await this.consumeEmailVerificationToken(email, dto.emailVerificationToken);

    try {
      return this.toAuthResponse(
        await this.usersRepository.createEmailUser({
          email,
          passwordHash: await this.hashPassword(dto.password),
          nickname:
            this.normalizeOptionalNickname(dto.nickname) ??
            generateRandomNickname(),
        }),
      );
    } catch (error) {
      this.handlePotentialDuplicateEmail(error);
      throw error;
    }
  }

  async requestEmailVerification(
    dto: EmailVerificationDto,
  ): Promise<EmailVerificationIssueResponse> {
    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);

    const code = this.generateVerificationCode();
    await this.usersRepository.expireEmailVerificationCodes(email);
    await this.usersRepository.createEmailVerificationCode({
      email,
      codeHash: this.hashVerificationCode(email, code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await this.authMailerService.sendEmailVerificationCode(email, code);

    return EmailVerificationIssueResponseSchema.parse({
      ok: true,
    });
  }

  async confirmEmailVerification(
    dto: ConfirmEmailVerificationDto,
  ): Promise<EmailVerificationConfirmResponse> {
    const email = this.normalizeEmail(dto.email);
    const verification =
      await this.usersRepository.findLatestUsableEmailVerificationCode(email);

    if (!verification) {
      throw new BadRequestException('유효한 인증번호가 없습니다.');
    }

    if (verification.attempts >= 5) {
      throw new BadRequestException('인증번호 입력 횟수를 초과했습니다.');
    }

    const codeHash = this.hashVerificationCode(email, dto.code);
    if (verification.codeHash !== codeHash) {
      await this.usersRepository.incrementEmailVerificationAttempts(
        verification.id,
      );
      throw new BadRequestException('인증번호가 올바르지 않습니다.');
    }

    await this.usersRepository.markEmailVerificationCodeVerified(
      verification.id,
    );

    return EmailVerificationConfirmResponseSchema.parse({
      emailVerificationToken: await this.signEmailVerificationToken(
        email,
        verification.id,
      ),
    });
  }

  async handleKakaoCallback(profile: KakaoOAuthProfileDto, state: string) {
    const payload = await this.verifyOAuthState(state);
    if (payload.mode === 'link') {
      if (!payload.userId) {
        throw new UnauthorizedException('계정 연결 인증 정보가 필요합니다.');
      }
      await this.linkKakao(payload.userId, profile);
      return this.redirectUrl('connected', undefined, payload.redirectUrl);
    }

    const response = await this.loginWithKakao(profile);
    return this.redirectUrl('login', response.accessToken, payload.redirectUrl);
  }

  async loginWithKakao(profile: KakaoOAuthProfileDto) {
    const oauthAccount = await this.usersRepository.findByOAuthAccount(
      OAuthProvider.KAKAO,
      profile.providerAccountId,
    );

    if (oauthAccount) {
      await this.usersRepository.upsertOAuthAccount(
        this.toOAuthAccountData(oauthAccount.userId, profile),
      );
      return this.toAuthResponse(oauthAccount.user);
    }

    if (profile.providerEmail) {
      const existingEmailUser = await this.usersRepository.findByEmail(
        this.normalizeEmail(profile.providerEmail),
      );
      if (existingEmailUser) {
        throw new ConflictException(
          '이미 이메일로 가입된 계정입니다. 로그인 후 카카오 계정을 연결해주세요.',
        );
      }
    }

    try {
      const user = await this.usersRepository.createOAuthUser({
        ...this.toOAuthProfileData(profile),
        nickname: generateRandomNickname(),
      });
      return this.toAuthResponse(user);
    } catch (error) {
      this.handlePotentialDuplicateOAuth(error);
      this.handlePotentialDuplicateEmail(error);
      throw error;
    }
  }

  async listAuthConnections(userId: string): Promise<AuthConnectionsResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    return this.toAuthConnectionsResponse(
      await this.usersRepository.listAuthConnections(userId),
    );
  }

  async linkKakao(
    userId: string,
    profile: KakaoOAuthProfileDto,
  ): Promise<AuthConnectionsResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    await this.assertOAuthAccountAvailable(profile, userId);

    try {
      await this.usersRepository.upsertOAuthAccount(
        this.toOAuthAccountData(userId, profile),
      );
    } catch (error) {
      this.handlePotentialDuplicateOAuth(error);
      throw error;
    }

    return this.listAuthConnections(userId);
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    return MeResponseSchema.parse({
      user: serializeUser(user),
    });
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UpdateMeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    const updatedUser = await this.usersRepository.updateProfile(userId, {
      nickname: dto.nickname.trim(),
    });

    return UpdateMeResponseSchema.parse({
      user: serializeUser(updatedUser),
    });
  }

  async deleteMe(userId: string): Promise<DeleteMeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    return DeleteMeResponseSchema.parse(
      await this.usersRepository.deleteById(userId),
    );
  }

  async validateJwtPayload(payload: JwtUser) {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    return serializeUser(user);
  }

  private async toAuthResponse(user: User): Promise<AuthResponse> {
    return AuthResponseSchema.parse({
      user: serializeUser(user),
      accessToken: await this.signAccessToken(user),
    });
  }

  private signAccessToken(user: User) {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        authType: user.authType,
      } satisfies JwtUser,
      {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
        expiresIn: this.configService.getOrThrow<string>('auth.jwtExpiresIn'),
      },
    );
  }

  private async verifyOAuthState(state: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        mode: 'login' | 'link';
        userId?: string;
        redirectUrl?: string;
      }>(state, {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      });
      return payload;
    } catch {
      throw new UnauthorizedException('OAuth state가 유효하지 않습니다.');
    }
  }

  private redirectUrl(
    status: string,
    accessToken?: string,
    redirectUrl = this.configService.getOrThrow<string>('auth.webRedirectUrl'),
  ) {
    const url = new URL(redirectUrl);
    url.searchParams.set('oauth', status);
    if (accessToken) {
      url.searchParams.set('accessToken', accessToken);
    }
    return url.toString();
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeOptionalNickname(nickname?: string | null) {
    const normalized = nickname?.trim();
    return normalized ? normalized : null;
  }

  private hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  private generateVerificationCode() {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private hashVerificationCode(email: string, code: string) {
    return createHash('sha256').update(`${email}:${code}`).digest('hex');
  }

  private generatePasswordResetToken() {
    return randomBytes(32).toString('base64url');
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private passwordResetUrl(token: string) {
    const url = new URL(
      this.configService.getOrThrow<string>('auth.passwordResetUrl'),
    );
    url.searchParams.set('token', token);
    return url.toString();
  }

  private signEmailVerificationToken(email: string, codeId: string) {
    return this.jwtService.signAsync(
      {
        type: 'email-verification',
        email,
        codeId,
      },
      {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
        expiresIn: '10m',
      },
    );
  }

  private async consumeEmailVerificationToken(email: string, token: string) {
    let payload: { type?: string; email?: string; codeId?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      });
    } catch {
      throw new BadRequestException('이메일 인증이 만료되었습니다.');
    }

    if (
      payload.type !== 'email-verification' ||
      payload.email !== email ||
      !payload.codeId
    ) {
      throw new BadRequestException('이메일 인증 정보가 유효하지 않습니다.');
    }

    const verification =
      await this.usersRepository.findEmailVerificationCodeById(
        payload.codeId,
        email,
      );
    if (!verification) {
      throw new BadRequestException('이메일 인증 정보가 유효하지 않습니다.');
    }

    await this.usersRepository.markEmailVerificationCodeUsed(verification.id);
  }

  private toOAuthProfileData(profile: KakaoOAuthProfileDto) {
    return {
      provider: OAuthProvider.KAKAO,
      providerAccountId: profile.providerAccountId,
      providerEmail: profile.providerEmail
        ? this.normalizeEmail(profile.providerEmail)
        : null,
      providerNickname: profile.providerNickname?.trim() || null,
      rawProfile: profile.rawProfile
        ? (profile.rawProfile as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    };
  }

  private toOAuthAccountData(userId: string, profile: KakaoOAuthProfileDto) {
    return {
      userId,
      ...this.toOAuthProfileData(profile),
    };
  }

  private toAuthConnectionsResponse(
    connections: Awaited<ReturnType<UsersRepository['listAuthConnections']>>,
  ) {
    return AuthConnectionsResponseSchema.parse({
      connections: connections.map((connection) => ({
        provider: connection.provider,
        providerEmail: connection.providerEmail,
        providerNickname: connection.providerNickname,
        lastLoginAt: connection.lastLoginAt?.toISOString() ?? null,
        createdAt: connection.createdAt.toISOString(),
      })),
    });
  }

  private async assertEmailAvailable(email: string) {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
  }

  private async assertOAuthAccountAvailable(
    profile: KakaoOAuthProfileDto,
    currentUserId: string,
  ) {
    const existingOAuthAccount = await this.usersRepository.findByOAuthAccount(
      OAuthProvider.KAKAO,
      profile.providerAccountId,
    );

    if (existingOAuthAccount && existingOAuthAccount.userId !== currentUserId) {
      throw new ConflictException('이미 다른 계정에 연결된 카카오 계정입니다.');
    }
  }

  private handlePotentialDuplicateEmail(error: unknown) {
    if (this.usersRepository.isUniqueConstraintError(error, 'email')) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
  }

  private handlePotentialDuplicateOAuth(error: unknown) {
    if (this.usersRepository.isUniqueConstraintError(error)) {
      throw new ConflictException('이미 연결된 카카오 계정입니다.');
    }
  }
}
