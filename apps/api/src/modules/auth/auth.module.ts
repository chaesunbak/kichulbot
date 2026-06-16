import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController, MeController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthMailerService } from './auth-mailer.service';
import { AdminOrServiceAccountGuard } from './guards/admin-or-service-account.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { KakaoAuthGuard, KakaoCallbackGuard } from './guards/kakao-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ServiceAccountsRepository } from './service-accounts.repository';
import { ServiceAccountsService } from './service-accounts.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('auth.jwtExpiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [
    AuthService,
    AuthMailerService,
    UsersRepository,
    ServiceAccountsRepository,
    ServiceAccountsService,
    JwtStrategy,
    KakaoStrategy,
    JwtAuthGuard,
    AdminOrServiceAccountGuard,
    KakaoAuthGuard,
    KakaoCallbackGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    JwtModule,
    RolesGuard,
    AdminOrServiceAccountGuard,
    ServiceAccountsService,
  ],
})
export class AuthModule {}
