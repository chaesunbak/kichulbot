import {
  SignupMethod,
  UserRole,
} from '../../infrastructure/database/prisma-client';
import { AuthController, MeController } from './auth.controller';
import type { AuthService } from './auth.service';

const serializedUser = {
  id: 'user_1',
  email: 'student@example.com',
  nickname: null,
  signupMethod: SignupMethod.EMAIL,
  authMethods: ['EMAIL' as const],
  linkedProviders: [],
  role: UserRole.USER,
  createdAt: '2026-05-28T00:00:00.000Z',
  updatedAt: '2026-05-28T00:00:00.000Z',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      requestEmailVerification: jest.fn(),
      confirmEmailVerification: jest.fn(),
      requestPasswordReset: jest.fn(),
      confirmPasswordReset: jest.fn(),
      login: jest.fn(),
      getMe: jest.fn(),
      handleKakaoCallback: jest.fn(),
      exchangeOAuthCode: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    controller = new AuthController(authService);
  });

  it('이메일 회원가입 요청을 인증 서비스에 위임한다', async () => {
    authService.register.mockResolvedValue({
      user: { ...serializedUser, email: 'student@example.com' },
      accessToken: 'token',
    });

    const dto = {
      email: 'student@example.com',
      password: 'password123',
      nickname: '학생',
      emailVerificationToken: 'email-token',
    };

    await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('인증번호 발송 요청을 인증 서비스에 위임한다', async () => {
    authService.requestEmailVerification.mockResolvedValue({ ok: true });

    await controller.requestEmailVerification({
      email: 'student@example.com',
    });

    expect(authService.requestEmailVerification).toHaveBeenCalledWith({
      email: 'student@example.com',
    });
  });

  it('인증번호 확인 요청을 인증 서비스에 위임한다', async () => {
    authService.confirmEmailVerification.mockResolvedValue({
      emailVerificationToken: 'email-token',
    });

    await controller.confirmEmailVerification({
      email: 'student@example.com',
      code: '123456',
    });

    expect(authService.confirmEmailVerification).toHaveBeenCalledWith({
      email: 'student@example.com',
      code: '123456',
    });
  });

  it('비밀번호 재설정 요청을 인증 서비스에 위임한다', async () => {
    authService.requestPasswordReset.mockResolvedValue({ ok: true });

    await controller.requestPasswordReset({
      email: 'student@example.com',
    });

    expect(authService.requestPasswordReset).toHaveBeenCalledWith({
      email: 'student@example.com',
    });
  });

  it('비밀번호 재설정 확인 요청을 인증 서비스에 위임한다', async () => {
    authService.confirmPasswordReset.mockResolvedValue({ ok: true });

    await controller.confirmPasswordReset({
      token: 'reset-token',
      password: 'new-password123',
    });

    expect(authService.confirmPasswordReset).toHaveBeenCalledWith({
      token: 'reset-token',
      password: 'new-password123',
    });
  });

  it('OAuth 일회용 code 교환 요청을 인증 서비스에 위임한다', async () => {
    authService.exchangeOAuthCode.mockResolvedValue({
      user: { ...serializedUser, email: 'student@example.com' },
      accessToken: 'token',
    });

    await controller.exchangeOAuthCode({ code: 'oauth-code' });

    expect(authService.exchangeOAuthCode).toHaveBeenCalledWith({
      code: 'oauth-code',
    });
  });
});

describe('MeController', () => {
  let controller: MeController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      getMe: jest.fn(),
      updateMe: jest.fn(),
      listAuthConnections: jest.fn(),
      deleteMe: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    controller = new MeController(authService);
  });

  it('현재 사용자 식별자를 내 정보 수정 메서드에 전달한다', async () => {
    authService.updateMe.mockResolvedValue({
      user: { ...serializedUser, nickname: '새 닉네임' },
    });

    await controller.updateMe(
      {
        id: 'user_1',
        email: 'student@example.com',
        nickname: null,
        role: UserRole.USER,
      },
      { nickname: '새 닉네임' },
    );

    expect(authService.updateMe).toHaveBeenCalledWith('user_1', {
      nickname: '새 닉네임',
    });
  });
});
