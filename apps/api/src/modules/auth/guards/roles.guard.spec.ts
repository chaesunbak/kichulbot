import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { UserRole } from '../../../infrastructure/database/prisma-client';
import { RolesGuard } from './roles.guard';

function contextWithUser(role?: UserRole): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('역할 메타데이터가 없으면 요청을 허용한다', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector);

    expect(guard.canActivate(contextWithUser())).toBe(true);
  });

  it('요구된 역할을 가진 사용자는 허용한다', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector);

    expect(guard.canActivate(contextWithUser(UserRole.ADMIN))).toBe(true);
  });

  it('요구된 역할이 없는 사용자는 차단한다', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector);

    expect(guard.canActivate(contextWithUser(UserRole.USER))).toBe(false);
  });
});
