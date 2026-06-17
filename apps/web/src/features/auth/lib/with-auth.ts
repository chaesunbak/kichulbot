import 'server-only';

import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';

import { COOKIE_NAME } from './auth-cookie';
import type { AuthContext } from './server-auth';
import { getAuthContext } from './server-auth';

export type AuthRouteContext<TContext extends object = Record<string, never>> =
  TContext & {
    auth: AuthContext;
  };

type AuthRouteHandler<TContext extends object> = (
  request: Request,
  context: AuthRouteContext<TContext>,
) => Promise<Response> | Response;

export function withAuth<TContext extends object = Record<string, never>>(
  handler: AuthRouteHandler<TContext>,
) {
  return async function authenticatedRouteHandler(
    request: Request,
    context = {} as TContext,
  ) {
    const auth = await getAuthContext();
    if (!auth) {
      const response = localApiErrorResponse(
        401,
        '로그인이 필요합니다.',
        request,
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    return handler(request, { ...context, auth });
  };
}
