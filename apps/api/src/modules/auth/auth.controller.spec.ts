import { UserAuthType, UserRole } from '@prisma/client';

import { AuthController, MeController } from './auth.controller';
import type { AuthService } from './auth.service';

const serializedUser = {
  id: 'user_1',
  email: null,
  nickname: null,
  authType: UserAuthType.ANONYMOUS,
  role: UserRole.USER,
  createdAt: '2026-05-28T00:00:00.000Z',
  updatedAt: '2026-05-28T00:00:00.000Z',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      startAnonymous: jest.fn(),
      register: jest.fn(),
      convertAnonymous: jest.fn(),
      login: jest.fn(),
      getMe: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    controller = new AuthController(authService);
  });

  it('익명 시작 요청을 인증 서비스에 위임한다', async () => {
    authService.startAnonymous.mockResolvedValue({
      user: serializedUser,
      accessToken: 'token',
    });

    await expect(controller.startAnonymous()).resolves.toEqual({
      user: serializedUser,
      accessToken: 'token',
    });
  });

  it('현재 사용자 식별자를 익명 계정 전환 메서드에 전달한다', async () => {
    authService.convertAnonymous.mockResolvedValue({
      user: serializedUser,
      accessToken: 'token',
    });

    await controller.convertAnonymous(
      {
        id: 'user_1',
        email: null,
        nickname: null,
        authType: UserAuthType.ANONYMOUS,
        role: UserRole.USER,
      },
      {
        email: 'student@example.com',
        password: 'password123',
      },
    );

    expect(authService.convertAnonymous).toHaveBeenCalledWith('user_1', {
      email: 'student@example.com',
      password: 'password123',
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
        email: null,
        nickname: null,
        authType: UserAuthType.ANONYMOUS,
        role: UserRole.USER,
      },
      { nickname: '새 닉네임' },
    );

    expect(authService.updateMe).toHaveBeenCalledWith('user_1', {
      nickname: '새 닉네임',
    });
  });
});
