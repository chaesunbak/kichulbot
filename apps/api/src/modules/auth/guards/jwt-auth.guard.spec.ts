import type { Server } from 'node:http';

import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import {
  UserAuthType,
  UserRole,
} from '../../../infrastructure/database/prisma-client';
import { AuthService } from '../auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtStrategy } from '../strategies/jwt.strategy';
import type { RequestUser } from '../types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

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

@Controller('protected')
class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtected(@CurrentUser() user: RequestUser) {
    return { user };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdmin(@CurrentUser() user: RequestUser) {
    return { user };
  }
}

describe('JwtAuthGuard', () => {
  let app: INestApplication;
  let httpServer: Server;
  let jwtService: JwtService;
  let authService: jest.Mocked<Pick<AuthService, 'validateJwtPayload'>>;

  beforeEach(async () => {
    authService = {
      validateJwtPayload: jest.fn().mockResolvedValue(requestUser),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
        }),
      ],
      controllers: [ProtectedController],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        Reflector,
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'auth.jwtSecret') {
                return 'test-secret';
              }

              throw new Error(`Unexpected config key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    httpServer = app.getHttpServer() as Server;
    jwtService = moduleRef.get(JwtService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('베어러 토큰이 없으면 401을 반환한다', async () => {
    await request(httpServer).get('/protected').expect(401);
    expect(authService.validateJwtPayload).not.toHaveBeenCalled();
  });

  it('베어러 토큰이 유효하지 않으면 401을 반환한다', async () => {
    const invalidToken = await jwtService.signAsync(
      {
        sub: 'user_1',
        role: UserRole.USER,
        authType: UserAuthType.EMAIL,
      },
      {
        secret: 'wrong-secret',
      },
    );

    await request(httpServer)
      .get('/protected')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
    expect(authService.validateJwtPayload).not.toHaveBeenCalled();
  });

  it('유효한 베어러 토큰이면 요청 사용자 정보를 주입하고 접근을 허용한다', async () => {
    const token = await jwtService.signAsync({
      sub: 'user_1',
      role: UserRole.USER,
      authType: UserAuthType.EMAIL,
    });

    await request(httpServer)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({
        user: requestUser,
      });
    expect(authService.validateJwtPayload).toHaveBeenCalledWith({
      sub: 'user_1',
      role: UserRole.USER,
      authType: UserAuthType.EMAIL,
      iat: expect.any(Number),
    });
  });

  it('관리자 역할이면 역할 기반 엔드포인트 접근을 허용한다', async () => {
    authService.validateJwtPayload.mockResolvedValueOnce({
      ...requestUser,
      role: UserRole.ADMIN,
    });
    const token = await jwtService.signAsync({
      sub: 'user_1',
      role: UserRole.ADMIN,
      authType: UserAuthType.EMAIL,
    });

    await request(httpServer)
      .get('/protected/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({
        user: {
          ...requestUser,
          role: UserRole.ADMIN,
        },
      });
  });

  it('일반 사용자 역할이면 역할 기반 엔드포인트 접근을 차단한다', async () => {
    const token = await jwtService.signAsync({
      sub: 'user_1',
      role: UserRole.USER,
      authType: UserAuthType.EMAIL,
    });

    await request(httpServer)
      .get('/protected/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
