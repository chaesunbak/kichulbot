import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UserAuthType,
  UserRole,
} from '../../../infrastructure/database/prisma-client';

import type { AuthService } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let authService: jest.Mocked<Pick<AuthService, 'validateJwtPayload'>>;

  beforeEach(() => {
    authService = {
      validateJwtPayload: jest.fn(),
    };
  });

  it('인증 서비스로 JWT 정보를 검증하고 요청 사용자를 반환한다', async () => {
    const requestUser = {
      id: 'user_1',
      email: 'student.com',
      nickname: null,
      authType: UserAuthType.EMAIL,
      linkedProviders: [],
      role: UserRole.USER,
      createdAt: '2026-05-28T00:00:00.000Z',
      updatedAt: '2026-05-28T00:00:00.000Z',
    };
    authService.validateJwtPayload.mockResolvedValue(requestUser);

    const strategy = new JwtStrategy(
      authService as unknown as AuthService,
      new ConfigService({
        auth: {
          jwtSecret: 'test-secret',
        },
      }),
    );

    await expect(
      strategy.validate({
        sub: 'user_1',
        role: UserRole.USER,
        authType: UserAuthType.EMAIL,
      }),
    ).resolves.toEqual(requestUser);
    expect(authService.validateJwtPayload).toHaveBeenCalledWith({
      sub: 'user_1',
      role: UserRole.USER,
      authType: UserAuthType.EMAIL,
    });
  });

  it('인증 서비스의 인증 실패 예외를 그대로 유지한다', async () => {
    authService.validateJwtPayload.mockRejectedValue(
      new UnauthorizedException('인증 정보가 유효하지 않습니다.'),
    );

    const strategy = new JwtStrategy(
      authService as unknown as AuthService,
      new ConfigService({
        auth: {
          jwtSecret: 'test-secret',
        },
      }),
    );

    await expect(
      strategy.validate({
        sub: 'missing_user',
        role: UserRole.USER,
        authType: UserAuthType.EMAIL,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
