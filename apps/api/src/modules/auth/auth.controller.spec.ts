import { UserAuthType, UserRole } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

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

  it('delegates anonymous start to AuthService', async () => {
    authService.startAnonymous.mockResolvedValue({
      user: serializedUser,
      accessToken: 'token',
    });

    await expect(controller.startAnonymous()).resolves.toEqual({
      user: serializedUser,
      accessToken: 'token',
    });
  });

  it('passes current user id to convertAnonymous', async () => {
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
