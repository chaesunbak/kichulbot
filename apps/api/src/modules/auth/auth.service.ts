import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserAuthType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { serializeUser } from './auth.serializer';
import { ConvertAnonymousDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtUser } from './types';
import { UsersRepository } from './users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async startAnonymous() {
    const user = await this.usersRepository.createAnonymousUser();
    return this.toAuthResponse(user);
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);

    try {
      const user = await this.usersRepository.createEmailUser({
        email,
        passwordHash: await this.hashPassword(dto.password),
        nickname: dto.nickname,
      });

      return this.toAuthResponse(user);
    } catch (error) {
      this.handlePotentialDuplicateEmail(error);
      throw error;
    }
  }

  async convertAnonymous(userId: string, dto: ConvertAnonymousDto) {
    const currentUser = await this.usersRepository.findById(userId);
    if (!currentUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (currentUser.authType !== UserAuthType.ANONYMOUS) {
      throw new ForbiddenException(
        '게스트 사용자만 이메일 계정으로 전환할 수 있습니다.',
      );
    }

    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);

    try {
      const user = await this.usersRepository.convertAnonymousUser(userId, {
        email,
        passwordHash: await this.hashPassword(dto.password),
        nickname: dto.nickname,
      });

      return this.toAuthResponse(user);
    } catch (error) {
      this.handlePotentialDuplicateEmail(error);
      throw error;
    }
  }

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

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    return MeResponseSchema.parse({
      user: serializeUser(user),
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

  private hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async assertEmailAvailable(email: string) {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
  }

  private handlePotentialDuplicateEmail(error: unknown) {
    if (this.usersRepository.isUniqueConstraintError(error, 'email')) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
  }
}
import {
  AuthResponse,
  AuthResponseSchema,
  DeleteMeResponse,
  DeleteMeResponseSchema,
  MeResponse,
  MeResponseSchema,
} from '@kichulbot/api-contract/auth';
