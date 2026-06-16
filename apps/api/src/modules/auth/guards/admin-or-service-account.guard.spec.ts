import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import {
  UserAuthType,
  UserRole,
} from '../../../infrastructure/database/prisma-client';
import type { AuthService } from '../auth.service';
import type { ServiceAccountsService } from '../service-accounts.service';
import { AdminOrServiceAccountGuard } from './admin-or-service-account.guard';

describe('AdminOrServiceAccountGuard', () => {
  let guard: AdminOrServiceAccountGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;
  let authService: jest.Mocked<AuthService>;
  let serviceAccountsService: jest.Mocked<ServiceAccountsService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['paper-import:publish']),
    } as unknown as jest.Mocked<Reflector>;
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    authService = {
      validateJwtPayload: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    serviceAccountsService = {
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<ServiceAccountsService>;

    guard = new AdminOrServiceAccountGuard(
      reflector,
      jwtService,
      authService,
      serviceAccountsService,
    );
  });

  it('관리자 JWT이면 요청 user를 설정하고 통과시킨다', async () => {
    const request = makeRequest('admin-token');
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user_1',
      role: UserRole.ADMIN,
      authType: UserAuthType.EMAIL,
      tokenVersion: 0,
    });
    authService.validateJwtPayload.mockResolvedValue({
      id: 'user_1',
      email: 'admin@example.com',
      nickname: '관리자',
      authType: UserAuthType.EMAIL,
      role: UserRole.ADMIN,
      linkedProviders: [],
      createdAt: '2026-06-15T00:00:00.000Z',
      updatedAt: '2026-06-15T00:00:00.000Z',
    });

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    expect(request.user).toMatchObject({ id: 'user_1', role: UserRole.ADMIN });
    expect(serviceAccountsService.authenticate).not.toHaveBeenCalled();
  });

  it('관리자가 아닌 사용자 JWT는 거부한다', async () => {
    const request = makeRequest('user-token');
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user_1',
      role: UserRole.USER,
      authType: UserAuthType.EMAIL,
      tokenVersion: 0,
    });
    authService.validateJwtPayload.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      nickname: '사용자',
      authType: UserAuthType.EMAIL,
      role: UserRole.USER,
      linkedProviders: [],
      createdAt: '2026-06-15T00:00:00.000Z',
      updatedAt: '2026-06-15T00:00:00.000Z',
    });

    await expect(
      guard.canActivate(makeContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(serviceAccountsService.authenticate).not.toHaveBeenCalled();
  });

  it('JWT 검증이 실패하면 서비스 계정 토큰과 scope로 통과시킨다', async () => {
    const request = makeRequest('service-token');
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid jwt'));
    serviceAccountsService.authenticate.mockResolvedValue({
      id: 'service_account_1',
      name: 'extractor',
      scopes: ['paper-import:publish'],
    });

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    expect(serviceAccountsService.authenticate).toHaveBeenCalledWith(
      'service-token',
      ['paper-import:publish'],
    );
    expect(request.serviceAccount).toMatchObject({ name: 'extractor' });
  });

  it('Bearer 토큰이 없으면 거부한다', async () => {
    await expect(
      guard.canActivate(makeContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function makeRequest(token: string) {
  return {
    headers: {
      authorization: `Bearer ${token}`,
    },
  } as Request & { user?: unknown; serviceAccount?: unknown };
}

function makeContext(request: Pick<Request, 'headers'>) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
