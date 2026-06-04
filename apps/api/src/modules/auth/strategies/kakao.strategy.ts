import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';

export type KakaoOAuthProfile = {
  providerAccountId: string;
  providerEmail: string | null;
  providerNickname: string | null;
  rawProfile: Record<string, unknown> | null;
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
    const rawProfileValue: unknown = profile._json;
    const rawProfile = this.objectValue(
      { rawProfile: rawProfileValue },
      'rawProfile',
    );
    const kakaoAccount = this.objectValue(rawProfile, 'kakao_account');
    const profileObject = this.objectValue(kakaoAccount, 'profile');

    return {
      providerAccountId: String(profile.id),
      providerEmail: this.stringValue(kakaoAccount, 'email'),
      providerNickname: this.stringValue(profileObject, 'nickname'),
      rawProfile,
    };
  }

  private objectValue(
    source: Record<string, unknown> | null,
    key: string,
  ): Record<string, unknown> | null {
    const value = source?.[key];
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private stringValue(source: Record<string, unknown> | null, key: string) {
    const value = source?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
