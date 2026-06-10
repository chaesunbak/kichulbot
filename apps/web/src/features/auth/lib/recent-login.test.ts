import { describe, expect, it } from 'vitest';

import {
  readRecentLogin,
  RECENT_LOGIN_STORAGE_KEY,
  rememberRecentLogin,
} from '@/features/auth/lib/recent-login';

function createStorage() {
  const items = new Map<string, string>();

  return {
    getItem: (key: string) => items.get(key) ?? null,
    removeItem: (key: string) => {
      items.delete(key);
    },
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
  };
}

describe('recent login', () => {
  it('최근 로그인 수단을 저장하고 읽는다', () => {
    const storage = createStorage();

    rememberRecentLogin(
      { method: 'email', email: ' User@Example.COM ' },
      storage,
      1000,
    );

    expect(readRecentLogin(storage, 1000)).toEqual({
      method: 'email',
      loggedInAt: 1000,
    });
  });

  it('오래된 최근 로그인 기록은 삭제하고 보여주지 않는다', () => {
    const storage = createStorage();

    rememberRecentLogin({ method: 'kakao' }, storage, 1000);

    expect(readRecentLogin(storage, 1000 * 60 * 60 * 24 * 181)).toBeNull();
    expect(storage.getItem(RECENT_LOGIN_STORAGE_KEY)).toBeNull();
  });

  it('형식이 올바르지 않은 기록은 삭제하고 무시한다', () => {
    const storage = createStorage();
    storage.setItem(RECENT_LOGIN_STORAGE_KEY, '{"method":"github"}');

    expect(readRecentLogin(storage, 1000)).toBeNull();
    expect(storage.getItem(RECENT_LOGIN_STORAGE_KEY)).toBeNull();
  });
});
