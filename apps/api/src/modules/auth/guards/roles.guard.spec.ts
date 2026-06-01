import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

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
  it('allows requests when no role metadata is required', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector);

    expect(guard.canActivate(contextWithUser())).toBe(true);
  });

  it('allows users with a required role', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector);

    expect(guard.canActivate(contextWithUser(UserRole.ADMIN))).toBe(true);
  });

  it('blocks users without a required role', () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as unknown as Reflector);

    expect(guard.canActivate(contextWithUser(UserRole.USER))).toBe(false);
  });
});
