import 'server-only';

import { ApiError } from '@kichulbot/api-contract';
import { redirect } from 'next/navigation';

export function redirectToLogin(nextPath: string): never {
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function redirectToLoginIfUnauthorized(
  error: unknown,
  nextPath: string,
) {
  if (isUnauthorizedError(error)) {
    redirectToLogin(nextPath);
  }
}
