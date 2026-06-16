import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { UserRole } from '../../../infrastructure/database/prisma-client';
import { AuthService } from '../auth.service';
import type { RequestServiceAccount } from '../service-accounts.service';
import { ServiceAccountsService } from '../service-accounts.service';
import type { JwtUser, RequestUser } from '../types';

type RequestWithActor = Request & {
  user?: RequestUser;
  serviceAccount?: RequestServiceAccount;
};

@Injectable()
export class AdminOrServiceAccountGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly serviceAccountsService: ServiceAccountsService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const token = this.extractBearerToken(request);

    const user = await this.authenticateUser(token).catch(() => null);
    if (user) {
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('관리자만 접근할 수 있습니다.');
      }
      request.user = user;
      return true;
    }

    request.serviceAccount =
      await this.serviceAccountsService.authenticate(token);
    return true;
  }

  private extractBearerToken(request: Request) {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증 정보가 없습니다.');
    }

    return authorization.slice('Bearer '.length).trim();
  }

  private async authenticateUser(token: string) {
    const payload = await this.jwtService.verifyAsync<JwtUser>(token);
    return this.authService.validateJwtPayload(payload);
  }
}
