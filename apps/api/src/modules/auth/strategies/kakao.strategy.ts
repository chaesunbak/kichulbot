import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';

export type KakaoOAuthProfile = {
  providerAccountId: string;
};

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('auth.kakao.clientId') ?? 'missing',
      clientSecret: configService.get<string>('auth.kakao.clientSecret') ?? '',
      callbackURL: configService.getOrThrow<string>('auth.kakao.callbackUrl'),
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): KakaoOAuthProfile {
    return {
      providerAccountId: String(profile.id),
    };
  }
}
