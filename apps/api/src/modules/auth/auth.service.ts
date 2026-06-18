import {
  AuthConnectionsResponse,
  AuthResponse,
  DeleteMeResponse,
  EmailVerificationConfirmResponse,
  EmailVerificationIssueResponse,
  MeResponse,
  PasswordResetConfirmResponse,
  PasswordResetIssueResponse,
  UpdateMeResponse,
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
  User,
} from '../../infrastructure/database/prisma-client';
import { getAuthMethods, serializeUser } from './auth.serializer';
import { AuthMailerService } from './auth-mailer.service';
import {
  ConfigureEmailLoginDto,
  ConfirmEmailVerificationDto,
  EmailVerificationDto,
  KakaoOAuthProfileDto,
  LoginDto,
  OAuthCodeExchangeDto,
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

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(
      this.normalizeEmail(dto.email),
    );

    if (!user?.email || !user.passwordHash) {
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

    if (!user || !user.email || !user.passwordHash) {
      return { ok: true };
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

    return {
      ok: true,
    };
  }

  async confirmPasswordReset(
    dto: PasswordResetConfirmDto,
  ): Promise<PasswordResetConfirmResponse> {
    const resetToken = await this.usersRepository.findUsablePasswordResetToken(
      this.hashPasswordResetToken(dto.token),
    );

    if (
      !resetToken ||
      !resetToken.user.email ||
      !resetToken.user.passwordHash
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

    return { ok: true };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);
    await this.consumeEmailVerificationToken(dto.emailVerificationToken, email);

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

    return {
      ok: true,
    };
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

    return {
      emailVerificationToken: await this.signEmailVerificationToken(
        email,
        verification.id,
      ),
    };
  }

  async handleKakaoCallback(
    profile: KakaoOAuthProfileDto,
    state: string,
  ): Promise<string> {
    const payload = await this.verifyOAuthState(state);
    if (payload.mode === 'link') {
      if (!payload.userId || typeof payload.tokenVersion !== 'number') {
        throw new UnauthorizedException('계정 연결 인증 정보가 필요합니다.');
      }
      await this.linkKakao(payload.userId, payload.tokenVersion, profile);
      return this.redirectUrl('connected', undefined, payload.redirectUrl);
    }

    const response = await this.loginWithKakao(profile);
    const code = await this.issueOAuthAuthorizationCode(response.user.id);
    return this.redirectUrl('login', { code }, payload.redirectUrl);
  }

  async exchangeOAuthCode(dto: OAuthCodeExchangeDto): Promise<AuthResponse> {
    const authorizationCode =
      await this.usersRepository.consumeOAuthAuthorizationCode(
        this.hashOAuthAuthorizationCode(dto.code),
      );
    if (!authorizationCode?.user) {
      throw new UnauthorizedException('OAuth 인증 코드가 유효하지 않습니다.');
    }

    return this.toAuthResponse(authorizationCode.user);
  }

  async loginWithKakao(profile: KakaoOAuthProfileDto): Promise<AuthResponse> {
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

  async unlinkAuthConnection(
    userId: string,
    provider: OAuthProvider,
  ): Promise<MeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    if (!user.oauthAccounts.some((account) => account.provider === provider)) {
      throw new BadRequestException('연결된 계정이 아닙니다.');
    }

    this.assertCanRemoveAuthMethod(user, provider);
    await this.usersRepository.deleteOAuthAccount(userId, provider);

    return this.getMe(userId);
  }

  async requestMyEmailVerification(
    userId: string,
    dto: EmailVerificationDto,
  ): Promise<EmailVerificationIssueResponse> {
    await this.assertAuthenticatedUser(userId);
    return this.requestEmailVerification(dto);
  }

  async confirmMyEmailVerification(
    userId: string,
    dto: ConfirmEmailVerificationDto,
  ): Promise<EmailVerificationConfirmResponse> {
    await this.assertAuthenticatedUser(userId);
    return this.confirmEmailVerification(dto);
  }

  async configureEmailLogin(
    userId: string,
    dto: ConfigureEmailLoginDto,
  ): Promise<AuthResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }
    if (getAuthMethods(user).includes('EMAIL')) {
      throw new BadRequestException('이미 이메일 로그인이 설정되어 있습니다.');
    }

    const email = await this.consumeEmailVerificationToken(
      dto.emailVerificationToken,
    );
    await this.assertEmailAvailableForUser(email, userId);

    try {
      return this.toAuthResponse(
        await this.usersRepository.updateEmailLogin(userId, {
          email,
          passwordHash: await this.hashPassword(dto.password),
        }),
      );
    } catch (error) {
      this.handlePotentialDuplicateEmail(error);
      throw error;
    }
  }

  private async linkKakao(
    userId: string,
    tokenVersion: number,
    profile: KakaoOAuthProfileDto,
  ): Promise<AuthConnectionsResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }
    if (user.tokenVersion !== tokenVersion) {
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

    return {
      user: serializeUser(user),
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UpdateMeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    const updatedUser = await this.usersRepository.updateProfile(userId, {
      nickname: dto.nickname.trim(),
    });

    return {
      user: serializeUser(updatedUser),
    };
  }

  async deleteMe(userId: string): Promise<DeleteMeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    const deleted = await this.usersRepository.deleteById(userId);
    return { id: deleted.id };
  }

  async validateJwtPayload(payload: JwtUser) {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    return serializeUser(user);
  }

  private async toAuthResponse(user: User): Promise<AuthResponse> {
    return {
      user: serializeUser(user),
      accessToken: await this.signAccessToken(user),
    };
  }

  private signAccessToken(user: User) {
    const payload: JwtUser = {
      sub: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      expiresIn: this.configService.getOrThrow<string>('auth.jwtExpiresIn'),
    });
  }

  private async verifyOAuthState(state: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        mode: 'login' | 'link';
        userId?: string;
        tokenVersion?: number;
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
    params: { code?: string } = {},
    redirectUrl = this.configService.getOrThrow<string>('auth.webRedirectUrl'),
  ) {
    const url = new URL(redirectUrl);
    url.searchParams.set('oauth', status);
    if (params.code) {
      url.searchParams.set('code', params.code);
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

  private async issueOAuthAuthorizationCode(userId: string) {
    const code = randomBytes(32).toString('base64url');
    await this.usersRepository.expireOAuthAuthorizationCodes(userId);
    await this.usersRepository.createOAuthAuthorizationCode({
      userId,
      codeHash: this.hashOAuthAuthorizationCode(code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    return code;
  }

  private hashOAuthAuthorizationCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
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

  private async consumeEmailVerificationToken(
    token: string,
    expectedEmail?: string,
  ) {
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
      !payload.email ||
      !payload.codeId
    ) {
      throw new BadRequestException('이메일 인증 정보가 유효하지 않습니다.');
    }

    const email = this.normalizeEmail(payload.email);
    if (expectedEmail && email !== expectedEmail) {
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
    return email;
  }

  private toOAuthProfileData(profile: KakaoOAuthProfileDto) {
    return {
      provider: OAuthProvider.KAKAO,
      providerAccountId: profile.providerAccountId,
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
  ): AuthConnectionsResponse {
    return {
      connections: connections.map((connection) => ({
        provider: connection.provider,
        lastLoginAt: connection.lastLoginAt?.toISOString() ?? null,
        createdAt: connection.createdAt.toISOString(),
      })),
    };
  }

  private async assertEmailAvailable(email: string) {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
  }

  private async assertEmailAvailableForUser(email: string, userId: string) {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
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

  private async assertAuthenticatedUser(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }
    return user;
  }

  private assertCanRemoveAuthMethod(
    user: User & { oauthAccounts?: Array<{ provider: OAuthProvider }> },
    method: 'EMAIL' | OAuthProvider,
  ) {
    const remainingMethods = getAuthMethods(user).filter(
      (authMethod) => authMethod !== method,
    );
    if (remainingMethods.length === 0) {
      throw new BadRequestException('마지막 로그인 수단은 해제할 수 없습니다.');
    }
  }
}
