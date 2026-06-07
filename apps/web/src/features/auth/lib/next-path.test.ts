import { describe, expect, it } from 'vitest';

import { normalizeNextPath } from '@/features/auth/lib/next-path';

describe('normalizeNextPath', () => {
  it('내부 경로만 그대로 반환한다', () => {
    expect(normalizeNextPath('/my/profile')).toBe('/my/profile');
    expect(normalizeNextPath('/resources/search?q=민법')).toBe(
      '/resources/search?q=민법',
    );
  });

  it('비어 있거나 외부로 이동할 수 있는 경로는 fallback을 반환한다', () => {
    expect(normalizeNextPath(null)).toBe('/');
    expect(normalizeNextPath(undefined)).toBe('/');
    expect(normalizeNextPath('https://example.com')).toBe('/');
    expect(normalizeNextPath('//example.com/path')).toBe('/');
  });

  it('fallback을 지정할 수 있다', () => {
    expect(normalizeNextPath('', { fallback: '/login' })).toBe('/login');
  });

  it('디코딩 옵션을 사용하면 인코딩된 내부 경로만 허용한다', () => {
    expect(normalizeNextPath('%2Fmy%2Fsettings', { decode: true })).toBe(
      '/my/settings',
    );
    expect(normalizeNextPath('%2F%2Fevil.test', { decode: true })).toBe('/');
    expect(normalizeNextPath('%E0%A4%A', { decode: true })).toBe('/');
  });
});
