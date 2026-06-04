import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

type OAuthMode = 'login' | 'link';

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const mode = this.getMode(request);
    const userId = this.getUserId(request);
    const state = this.jwtService.sign(
      { mode, userId },
      {
        secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
        expiresIn: '10m',
      },
    );

    return {
      state,
      failureRedirect: this.configService.getOrThrow<string>(
        'auth.webRedirectUrl',
      ),
    };
  }

  private getMode(request: Request): OAuthMode {
    const mode = request.query.mode;
    return mode === 'link' ? mode : 'login';
  }

  private getUserId(request: Request) {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(
        authorization.slice('Bearer '.length),
        {
          secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
        },
      );
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}

@Injectable()
export class KakaoCallbackGuard extends AuthGuard('kakao') {}
