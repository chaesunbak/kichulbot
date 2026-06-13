import { isRecord } from '@/shared/lib/is-record';

export type RecentLoginMethod = 'email' | 'kakao';

export interface RecentLoginRecord {
  method: RecentLoginMethod;
  loggedInAt: number;
}

type RecentLoginStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

export const RECENT_LOGIN_STORAGE_KEY = 'kichulbot_recent_login';
const RECENT_LOGIN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 180;

export function rememberRecentLogin(
  input: {
    method: RecentLoginMethod;
    email?: string | null;
  },
  storage = getRecentLoginStorage(),
  loggedInAt = Date.now(),
) {
  if (!storage) return;

  const record: RecentLoginRecord = {
    method: input.method,
    loggedInAt,
  };

  try {
    storage.setItem(RECENT_LOGIN_STORAGE_KEY, JSON.stringify(record));
  } catch {
    return;
  }
}

export function readRecentLogin(
  storage = getRecentLoginStorage(),
  now = Date.now(),
): RecentLoginRecord | null {
  if (!storage) return null;

  try {
    const rawRecord = storage.getItem(RECENT_LOGIN_STORAGE_KEY);
    if (!rawRecord) return null;

    const record = parseRecentLoginRecord(rawRecord, now);
    if (!record) {
      storage.removeItem(RECENT_LOGIN_STORAGE_KEY);
      return null;
    }

    return record;
  } catch {
    return null;
  }
}

export function parseRecentLoginRecord(
  rawRecord: string,
  now = Date.now(),
): RecentLoginRecord | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawRecord);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (parsed.method !== 'email' && parsed.method !== 'kakao') return null;
  if (
    typeof parsed.loggedInAt !== 'number' ||
    !Number.isFinite(parsed.loggedInAt)
  ) {
    return null;
  }
  if (now - parsed.loggedInAt > RECENT_LOGIN_MAX_AGE_MS) return null;

  return {
    method: parsed.method,
    loggedInAt: parsed.loggedInAt,
  };
}

function getRecentLoginStorage(): RecentLoginStorage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
