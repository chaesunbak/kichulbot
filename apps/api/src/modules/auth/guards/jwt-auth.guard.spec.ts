import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';

import {
  SignupMethod,
  UserRole,
} from '../../../infrastructure/database/prisma-client';
import { JwtAuthGuard } from './jwt-auth.guard';

type AuthenticateCallback = (
  error: Error | null,
  user?: unknown,
  info?: unknown,
  status?: unknown,
) => void;

type AuthenticateMiddleware = (
  request: object,
  response: object,
  next: (error?: unknown) => void,
) => void;

type AuthenticateFunction = (
  strategy: string,
  options: Record<string, unknown>,
  callback?: AuthenticateCallback,
) => AuthenticateMiddleware;

jest.mock('passport', () => ({
  authenticate: jest.fn(),
}));

const mockPassport: {
  authenticate: jest.Mock<
    ReturnType<AuthenticateFunction>,
    Parameters<AuthenticateFunction>
  >;
} = jest.requireMock('passport');

const mockAuthenticate = mockPassport.authenticate;

const requestUser = {
  id: 'user_1',
  email: 'student.com',
  nickname: null,
  signupMethod: SignupMethod.EMAIL,
  authMethods: ['EMAIL'],
  linkedProviders: [],
  role: UserRole.USER,
  createdAt: '2026-05-28T00:00:00.000Z',
  updatedAt: '2026-05-28T00:00:00.000Z',
};

function createHttpContext(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('JWT 전략으로 인증하고 요청 객체에 사용자를 주입한다', async () => {
    const request: { user?: typeof requestUser; authInfo?: unknown } = {};
    mockAuthenticate.mockImplementation(
      (
        _strategy: string,
        _options: Record<string, unknown>,
        callback?: AuthenticateCallback,
      ) => {
        return () => {
          callback?.(null, requestUser, undefined, undefined);
        };
      },
    );
    const guard = new JwtAuthGuard();

    await expect(guard.canActivate(createHttpContext(request))).resolves.toBe(
      true,
    );

    expect(mockAuthenticate).toHaveBeenCalledWith(
      'jwt',
      expect.objectContaining({ property: 'user' }),
      expect.any(Function),
    );
    expect(request.user).toEqual(requestUser);
  });

  it('인증 사용자가 없으면 401 예외를 던진다', async () => {
    mockAuthenticate.mockImplementation(
      (
        _strategy: string,
        _options: Record<string, unknown>,
        callback?: AuthenticateCallback,
      ) => {
        return () => {
          callback?.(null, false, undefined, undefined);
        };
      },
    );
    const guard = new JwtAuthGuard();

    await expect(
      guard.canActivate(createHttpContext({})),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('Passport 인증 오류를 그대로 유지한다', async () => {
    const error = new Error('토큰 서명 검증에 실패했습니다.');
    mockAuthenticate.mockImplementation(
      (
        _strategy: string,
        _options: Record<string, unknown>,
        callback?: AuthenticateCallback,
      ) => {
        return () => {
          callback?.(error, false, undefined, undefined);
        };
      },
    );
    const guard = new JwtAuthGuard();

    await expect(guard.canActivate(createHttpContext({}))).rejects.toBe(error);
  });
});
