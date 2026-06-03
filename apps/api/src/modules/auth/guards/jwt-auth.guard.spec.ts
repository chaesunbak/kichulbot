import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { UserAuthType, UserRole } from '@prisma/client';
import * as request from 'supertest';

import { AuthService } from '../auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtStrategy } from '../strategies/jwt.strategy';
import type { RequestUser } from '../types';
import { JwtAuthGuard } from './jwt-auth.guard';

const requestUser = {
  id: 'user_1',
  email: null,
  nickname: null,
  authType: UserAuthType.ANONYMOUS,
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
}

describe('JwtAuthGuard', () => {
  let app: INestApplication;
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
    jwtService = moduleRef.get(JwtService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('베어러 토큰이 없으면 401을 반환한다', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
    expect(authService.validateJwtPayload).not.toHaveBeenCalled();
  });

  it('베어러 토큰이 유효하지 않으면 401을 반환한다', async () => {
    const invalidToken = await jwtService.signAsync(
      {
        sub: 'user_1',
        role: UserRole.USER,
        authType: UserAuthType.ANONYMOUS,
      },
      {
        secret: 'wrong-secret',
      },
    );

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);
    expect(authService.validateJwtPayload).not.toHaveBeenCalled();
  });

  it('유효한 베어러 토큰이면 요청 사용자 정보를 주입하고 접근을 허용한다', async () => {
    const token = await jwtService.signAsync({
      sub: 'user_1',
      role: UserRole.USER,
      authType: UserAuthType.ANONYMOUS,
    });

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({
        user: requestUser,
      });
    expect(authService.validateJwtPayload).toHaveBeenCalledWith({
      sub: 'user_1',
      role: UserRole.USER,
      authType: UserAuthType.ANONYMOUS,
      iat: expect.any(Number),
    });
  });
});
