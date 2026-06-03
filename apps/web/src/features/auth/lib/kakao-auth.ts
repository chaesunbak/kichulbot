export type KakaoAuthMode = 'login' | 'convert' | 'link';

export function getKakaoAuthStartPath(
  mode: KakaoAuthMode = 'login',
  next?: string,
) {
  const query = new URLSearchParams();
  if (mode !== 'login') {
    query.set('mode', mode);
  }
  if (next) {
    query.set('next', next);
  }

  const serialized = query.toString();
  return serialized
    ? `/api/auth/kakao/start?${serialized}`
    : '/api/auth/kakao/start';
}
