import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import type {
  OAuthAccount,
  User,
} from '../../infrastructure/database/prisma-client';
import {
  OAuthProvider,
  SignupMethod,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import { AuthService } from './auth.service';
import type { AuthMailerService } from './auth-mailer.service';
import type { UsersRepository } from './users.repository';

const now = new Date('2026-05-28T00:00:00.000Z');
type TestUser = User & { oauthAccounts: OAuthAccount[] };

function oauthAccount(overrides: Partial<OAuthAccount> = {}): OAuthAccount {
  return {
    id: 'oauth_1',
    userId: 'user_1',
    provider: OAuthProvider.KAKAO,
    providerAccountId: '12345',
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function user(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'user_1',
    email: 'student@example.com',
    passwordHash: null,
    tokenVersion: 0,
    nickname: null,
    timezone: 'Asia/Seoul',
    signupMethod: SignupMethod.EMAIL,
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
      createOAuthUser: jest.fn(),
      createEmailUser: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByOAuthAccount: jest.fn(),
      listAuthConnections: jest.fn(),
      deleteById: jest.fn(),
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
      updateEmailLogin: jest.fn(),
      upsertOAuthAccount: jest.fn(),
      deleteOAuthAccount: jest.fn(),
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
      expireOAuthAuthorizationCodes: jest.fn(),
      createOAuthAuthorizationCode: jest.fn(),
      consumeOAuthAuthorizationCode: jest.fn(),
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
          webRedirectUrl: 'http://localhost:3000/oauth/callback',
          passwordResetUrl: 'http://localhost:3000/password-reset',
        },
      }),
      authMailerService,
    );
  });

  it('이메일 계정으로 로그인할 수 있다', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash,
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

  it('비밀번호가 없는 이메일 로그인은 거부한다', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash: null,
      }),
    );

    await expect(
      service.login({
        email: 'student@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('새 카카오 사용자로 로그인하면 OAuth 계정을 만든다', async () => {
    usersRepository.findByOAuthAccount.mockResolvedValue(null);
    usersRepository.createOAuthUser.mockResolvedValue(
      user({
        email: null,
        nickname: '학생',
        signupMethod: SignupMethod.KAKAO,
        oauthAccounts: [oauthAccount()],
      }),
    );

    await expect(
      service.loginWithKakao({
        providerAccountId: '12345',
      }),
    ).resolves.toMatchObject({
      user: {
        signupMethod: SignupMethod.KAKAO,
        authMethods: ['KAKAO'],
        email: null,
      },
    });
    expect(usersRepository.createOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: OAuthProvider.KAKAO,
        providerAccountId: '12345',
        nickname: expect.any(String),
      }),
    );
  });

  it('카카오 콜백은 state의 모바일 redirectUrl로 일회용 code를 전달한다', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      mode: 'login',
      redirectUrl: 'kichulbot://oauth/callback',
    });
    usersRepository.findByOAuthAccount.mockResolvedValue(null);
    usersRepository.createOAuthUser.mockResolvedValue(
      user({
        email: null,
        signupMethod: SignupMethod.KAKAO,
        oauthAccounts: [oauthAccount()],
      }),
    );
    usersRepository.expireOAuthAuthorizationCodes.mockResolvedValue({
      count: 0,
    });
    usersRepository.createOAuthAuthorizationCode.mockResolvedValue(
      {} as Awaited<
        ReturnType<UsersRepository['createOAuthAuthorizationCode']>
      >,
    );

    const redirectUrl = await service.handleKakaoCallback(
      {
        providerAccountId: '12345',
      },
      'oauth-state',
    );
    const url = new URL(redirectUrl);

    expect(url.protocol).toBe('kichulbot:');
    expect(url.searchParams.get('oauth')).toBe('login');
    expect(url.searchParams.get('accessToken')).toBeNull();
    expect(url.searchParams.get('code')).toEqual(expect.any(String));
    expect(usersRepository.createOAuthAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_1',
        codeHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
  });

  it('OAuth 일회용 code를 access token으로 교환한다', async () => {
    usersRepository.consumeOAuthAuthorizationCode.mockResolvedValue({
      id: 'code_1',
      userId: 'user_1',
      codeHash: 'code-hash',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: now,
      updatedAt: now,
      user: user({
        email: null,
        signupMethod: SignupMethod.KAKAO,
        oauthAccounts: [oauthAccount()],
      }),
    });

    await expect(
      service.exchangeOAuthCode({ code: 'oauth-code' }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        id: 'user_1',
      },
    });
    expect(usersRepository.consumeOAuthAuthorizationCode).toHaveBeenCalledWith(
      expect.any(String),
    );
  });

  it('카카오 해제 후 로그인 수단이 없으면 거부한다', async () => {
    usersRepository.findById.mockResolvedValue(
      user({
        email: null,
        passwordHash: null,
        signupMethod: SignupMethod.KAKAO,
        oauthAccounts: [oauthAccount()],
      }),
    );

    await expect(
      service.unlinkAuthConnection('user_1', OAuthProvider.KAKAO),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersRepository.deleteOAuthAccount).not.toHaveBeenCalled();
  });

  it('이메일 로그인 수단이 있으면 카카오 해제를 허용한다', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersRepository.findById
      .mockResolvedValueOnce(
        user({
          email: 'student@example.com',
          passwordHash,
          oauthAccounts: [oauthAccount()],
        }),
      )
      .mockResolvedValueOnce(
        user({
          email: 'student@example.com',
          passwordHash,
          oauthAccounts: [],
        }),
      );
    usersRepository.deleteOAuthAccount.mockResolvedValue(
      {} as Awaited<ReturnType<UsersRepository['deleteOAuthAccount']>>,
    );

    await expect(
      service.unlinkAuthConnection('user_1', OAuthProvider.KAKAO),
    ).resolves.toEqual({
      user: expect.objectContaining({
        authMethods: ['EMAIL'],
        linkedProviders: [],
      }),
    });
    expect(usersRepository.deleteOAuthAccount).toHaveBeenCalledWith(
      'user_1',
      OAuthProvider.KAKAO,
    );
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
        passwordHash: 'hash',
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
        signupMethod: SignupMethod.EMAIL,
        authMethods: ['EMAIL'],
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

  it('이메일 인증 토큰으로 이메일 로그인 수단을 설정한다', async () => {
    usersRepository.findById.mockResolvedValue(
      user({
        email: null,
        passwordHash: null,
        signupMethod: SignupMethod.KAKAO,
        oauthAccounts: [oauthAccount()],
      }),
    );
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
    usersRepository.updateEmailLogin.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash: 'new-hash',
        signupMethod: SignupMethod.KAKAO,
        tokenVersion: 1,
        oauthAccounts: [oauthAccount()],
      }),
    );
    jwtService.verifyAsync.mockResolvedValue({
      type: 'email-verification',
      email: 'student@example.com',
      codeId: 'code_1',
    });

    await expect(
      service.configureEmailLogin('user_1', {
        emailVerificationToken: 'email-token',
        password: 'password123',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        email: 'student@example.com',
        authMethods: ['EMAIL', 'KAKAO'],
      },
    });
    expect(usersRepository.updateEmailLogin).toHaveBeenCalledWith('user_1', {
      email: 'student@example.com',
      passwordHash: expect.any(String),
    });
  });

  it('이미 사용 중인 이메일로 이메일 로그인 수단 설정을 거부한다', async () => {
    usersRepository.findById.mockResolvedValue(user({ email: null }));
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
    usersRepository.findByEmail.mockResolvedValue(user({ id: 'other_user' }));
    jwtService.verifyAsync.mockResolvedValue({
      type: 'email-verification',
      email: 'student@example.com',
      codeId: 'code_1',
    });

    await expect(
      service.configureEmailLogin('user_1', {
        emailVerificationToken: 'email-token',
        password: 'password123',
      }),
    ).rejects.toThrow('이미 사용 중인 이메일입니다.');
    expect(usersRepository.updateEmailLogin).not.toHaveBeenCalled();
  });

  it('이메일 계정에 비밀번호 재설정 링크를 발송한다', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      user({
        email: 'student@example.com',
        passwordHash: 'hash',
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
        passwordHash: 'old-hash',
      }),
    });
    usersRepository.updatePassword.mockResolvedValue(
      user({
        email: 'student@example.com',
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

  it('JWT tokenVersion이 사용자와 다르면 인증을 거부한다', async () => {
    usersRepository.findById.mockResolvedValue(user({ tokenVersion: 2 }));

    await expect(
      service.validateJwtPayload({
        sub: 'user_1',
        role: UserRole.USER,
        tokenVersion: 1,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
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
