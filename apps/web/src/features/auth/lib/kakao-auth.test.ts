import { describe, expect, it } from 'vitest';

import { getKakaoAuthStartPath } from '@/features/auth/lib/kakao-auth';

describe('getKakaoAuthStartPath', () => {
  it('기본 로그인 시작 경로를 반환한다', () => {
    expect(getKakaoAuthStartPath()).toBe('/api/auth/kakao/start');
  });

  it('link 모드와 다음 경로를 쿼리 문자열로 직렬화한다', () => {
    expect(getKakaoAuthStartPath('link', '/my/settings?tab=연동')).toBe(
      '/api/auth/kakao/start?mode=link&next=%2Fmy%2Fsettings%3Ftab%3D%EC%97%B0%EB%8F%99',
    );
  });

  it('로그인 모드에서는 mode 쿼리를 생략한다', () => {
    expect(getKakaoAuthStartPath('login', '/resources/search')).toBe(
      '/api/auth/kakao/start?next=%2Fresources%2Fsearch',
    );
  });
});
