import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { AuthService } from '../auth.service';
import { JwtUser, RequestUser } from '../types';

type AuthenticatedRequest = Request & {
  user?: RequestUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      });
      request.user = await this.authService.validateJwtPayload(payload);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('인증 토큰이 유효하지 않습니다.');
    }
  }

  private extractBearerToken(request: Request) {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
