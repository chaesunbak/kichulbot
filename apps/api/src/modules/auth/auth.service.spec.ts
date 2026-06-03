import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { User } from '../../infrastructure/database/prisma-client';
import {
  OAuthProvider,
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import * as bcrypt from 'bcryptjs';

import type { AuthMailerService } from './auth-mailer.service';
import { AuthService } from './auth.service';
import type { UsersRepository } from './users.repository';

const now = new Date('2026-05-28T00:00:00.000Z');
type TestUser = User & { oauthAccounts: [] };

function user(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'user_1',
    email: null,
    passwordHash: null,
    nickname: null,
    timezone: 'Asia/Seoul',
    authType: UserAuthType.ANONYMOUS,
    role: UserRole.USER,
    createdAt: now,
    updatedAt: now,
    oauthAccounts: [],
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let authMailerService: jest.Mocked<AuthMailerService>;

  beforeEach(() => {
    usersRepository = {
      createAnonymousUser: jest.fn(),
      createOAuthUser: jest.fn(),
      createEmailUser: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByOAuthAccount: jest.fn(),
      listAuthConnections: jest.fn(),
      deleteById: jest.fn(),
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
      upsertOAuthAccount: jest.fn(),
      convertAnonymousUserWithOAuth: jest.fn(),
      convertAnonymousUser: jest.fn(),
      expireEmailVerificationCodes: jest.fn(),
      createEmailVerificationCode: jest.fn(),
      findLatestUsableEmailVerificationCode: jest.fn(),
      findEmailVerificationCodeById: jest.fn(),
      incrementEmailVerificationAttempts: jest.fn(),
      markEmailVerificationCodeVerified: jest.fn(),
      markEmailVerificationCodeUsed: jest.fn(),
      expirePasswordResetTokens: jest.fn(),
      createPasswordResetToken: jest.fn(),
      findUsablePasswordResetToken: jest.fn(),
      markPasswordResetTokenUsed: jest.fn(),
      isUniqueConstraintError: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    authMailerService = {
      sendEmailVerificationCode: jest.fn(),
      sendPasswordResetLink: jest.fn(),
    } as unknown as jest.Mocked<AuthMailerService>;

    service = new AuthService(
      usersRepository,
      jwtService,
      new ConfigService({
        auth: {
          jwtSecret: 'test-secret',
          jwtExpiresIn: '1h',
          passwordResetUrl: 'http://localhost:3000/password-reset',
        },
      }),
      authMailerService,
    );
  });

  it('익명 사용자를 만들고 액세스 토큰을 반환한다', async () => {
    usersRepository.createAnonymousUser.mockResolvedValue(user());

    await expect(service.startAnonymous()).resolves.toMatchObject({
      user: {
        id: 'user_1',
        authType: UserAuthType.ANONYMOUS,
        role: UserRole.USER,
      },
      accessToken: 'access-token',
    });
  });

  it('이메일 계정으로 로그인할 수 있다', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash,
        authType: UserAuthType.EMAIL,
      }),
    );

    await expect(
      service.login({
        email: 'Student@Example.COM',
        password: 'password123',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        email: 'student@example.com',
        role: UserRole.USER,
      },
    });
  });

  it('유효하지 않은 비밀번호 로그인은 거부한다', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'admin@example.com',
        passwordHash,
        authType: UserAuthType.EMAIL,
        role: UserRole.ADMIN,
      }),
    );

    await expect(
      service.login({
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('새 카카오 사용자로 로그인하면 OAuth 계정을 만든다', async () => {
    usersRepository.findByOAuthAccount.mockResolvedValue(null);
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.createOAuthUser.mockResolvedValue(
      user({
        email: 'student@example.com',
        nickname: '학생',
        authType: UserAuthType.OAUTH,
      }),
    );

    await expect(
      service.loginWithKakao({
        providerAccountId: '12345',
        providerEmail: 'Student@Example.COM',
        providerNickname: '학생',
        rawProfile: null,
      }),
    ).resolves.toMatchObject({
      user: {
        authType: UserAuthType.OAUTH,
        email: 'student@example.com',
      },
    });
    expect(usersRepository.createOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: OAuthProvider.KAKAO,
        providerAccountId: '12345',
        providerEmail: 'student@example.com',
      }),
    );
  });

  it('익명 사용자를 카카오 계정으로 전환한다', async () => {
    usersRepository.findById.mockResolvedValue(user());
    usersRepository.findByOAuthAccount.mockResolvedValue(null);
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.convertAnonymousUserWithOAuth.mockResolvedValue(
      user({
        email: 'student@example.com',
        authType: UserAuthType.OAUTH,
      }),
    );

    await expect(
      service.convertAnonymousWithKakao('user_1', {
        providerAccountId: '12345',
        providerEmail: 'student@example.com',
        providerNickname: '학생',
        rawProfile: null,
      }),
    ).resolves.toMatchObject({
      user: {
        authType: UserAuthType.OAUTH,
        email: 'student@example.com',
      },
    });
  });

  it('이메일 인증번호를 메일로 발송한다', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.expireEmailVerificationCodes.mockResolvedValue({
      count: 0,
    });
    usersRepository.createEmailVerificationCode.mockResolvedValue(
      {} as Awaited<ReturnType<UsersRepository['createEmailVerificationCode']>>,
    );

    const response = await service.requestEmailVerification({
      email: 'Student@Example.COM',
    });

    expect(response.ok).toBe(true);
    expect(usersRepository.createEmailVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        codeHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(authMailerService.sendEmailVerificationCode).toHaveBeenCalledWith(
      'student@example.com',
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it('인증번호 확인에 성공하면 회원가입용 토큰을 발급한다', async () => {
    usersRepository.findLatestUsableEmailVerificationCode.mockResolvedValue({
      id: 'code_1',
      email: 'student@example.com',
      codeHash:
        '9f2913884e1dddb02e7dc375ec6dec4a210efd7e84ba2ad1240904b32e7346e8',
      expiresAt: new Date(Date.now() + 60_000),
      verifiedAt: null,
      usedAt: null,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    usersRepository.markEmailVerificationCodeVerified.mockResolvedValue(
      {} as Awaited<
        ReturnType<UsersRepository['markEmailVerificationCodeVerified']>
      >,
    );
    jwtService.signAsync.mockResolvedValueOnce('email-token');

    await expect(
      service.confirmEmailVerification({
        email: 'student@example.com',
        code: '123456',
      }),
    ).resolves.toEqual({ emailVerificationToken: 'email-token' });
  });

  it('틀린 인증번호는 거부한다', async () => {
    usersRepository.findLatestUsableEmailVerificationCode.mockResolvedValue({
      id: 'code_1',
      email: 'student@example.com',
      codeHash: 'wrong-hash',
      expiresAt: new Date(Date.now() + 60_000),
      verifiedAt: null,
      usedAt: null,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      service.confirmEmailVerification({
        email: 'student@example.com',
        code: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      usersRepository.incrementEmailVerificationAttempts,
    ).toHaveBeenCalledWith('code_1');
  });

  it('이메일 인증 토큰으로 회원가입한다', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.findEmailVerificationCodeById.mockResolvedValue(
      {} as Awaited<
        ReturnType<UsersRepository['findEmailVerificationCodeById']>
      >,
    );
    usersRepository.markEmailVerificationCodeUsed.mockResolvedValue(
      {} as Awaited<
        ReturnType<UsersRepository['markEmailVerificationCodeUsed']>
      >,
    );
    usersRepository.createEmailUser.mockResolvedValue(
      user({
        email: 'student@example.com',
        authType: UserAuthType.EMAIL,
      }),
    );
    jwtService.verifyAsync.mockResolvedValue({
      type: 'email-verification',
      email: 'student@example.com',
      codeId: 'code_1',
    });

    await expect(
      service.register({
        email: 'Student@Example.COM',
        password: 'password123',
        nickname: ' 학생 ',
        emailVerificationToken: 'email-token',
      }),
    ).resolves.toMatchObject({
      user: {
        email: 'student@example.com',
        authType: UserAuthType.EMAIL,
      },
    });
    expect(usersRepository.createEmailUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        nickname: '학생',
        passwordHash: expect.any(String),
      }),
    );
  });

  it('이메일 계정에 비밀번호 재설정 링크를 발송한다', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash: 'hash',
        authType: UserAuthType.EMAIL,
      }),
    );
    usersRepository.expirePasswordResetTokens.mockResolvedValue({ count: 0 });
    usersRepository.createPasswordResetToken.mockResolvedValue(
      {} as Awaited<ReturnType<UsersRepository['createPasswordResetToken']>>,
    );

    const response = await service.requestPasswordReset({
      email: 'Student@Example.COM',
    });

    expect(response.ok).toBe(true);
    expect(usersRepository.createPasswordResetToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(authMailerService.sendPasswordResetLink).toHaveBeenCalledWith(
      'student@example.com',
      expect.stringContaining('/password-reset?token='),
    );
  });

  it('없는 이메일의 비밀번호 재설정 요청도 성공 응답으로 처리한다', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.requestPasswordReset({ email: 'unknown@example.com' }),
    ).resolves.toEqual({ ok: true });
    expect(authMailerService.sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it('재설정 토큰으로 비밀번호를 변경한다', async () => {
    usersRepository.findUsablePasswordResetToken.mockResolvedValue({
      id: 'reset_1',
      userId: 'user_1',
      tokenHash: 'token-hash',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      createdAt: now,
      updatedAt: now,
      user: user({
        email: 'student@example.com',
        authType: UserAuthType.EMAIL,
        passwordHash: 'old-hash',
      }),
    });
    usersRepository.updatePassword.mockResolvedValue(
      user({
        email: 'student@example.com',
        authType: UserAuthType.EMAIL,
      }),
    );
    usersRepository.markPasswordResetTokenUsed.mockResolvedValue(
      {} as Awaited<ReturnType<UsersRepository['markPasswordResetTokenUsed']>>,
    );

    await expect(
      service.confirmPasswordReset({
        token: 'reset-token',
        password: 'new-password123',
      }),
    ).resolves.toEqual({ ok: true });
    expect(usersRepository.updatePassword).toHaveBeenCalledWith(
      'user_1',
      expect.any(String),
    );
    expect(usersRepository.markPasswordResetTokenUsed).toHaveBeenCalledWith(
      'reset_1',
    );
  });

  it('현재 사용자 닉네임을 수정한다', async () => {
    usersRepository.findById.mockResolvedValue(user());
    usersRepository.updateProfile.mockResolvedValue(
      user({ nickname: '새 닉네임' }),
    );

    await expect(
      service.updateMe('user_1', { nickname: '  새 닉네임  ' }),
    ).resolves.toEqual({
      user: expect.objectContaining({ nickname: '새 닉네임' }),
    });
    expect(usersRepository.updateProfile).toHaveBeenCalledWith('user_1', {
      nickname: '새 닉네임',
    });
  });
});
