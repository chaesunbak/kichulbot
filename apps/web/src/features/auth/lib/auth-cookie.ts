export const COOKIE_NAME = 'kichulbot_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: COOKIE_MAX_AGE,
  sameSite: 'lax' as const,
};
