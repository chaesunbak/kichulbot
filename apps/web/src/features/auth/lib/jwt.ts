import { AuthResponseSchema } from '@kichulbot/api-contract/auth';
import { errors, jwtVerify } from 'jose';
import * as z from 'zod';

const AccessTokenPayloadSchema = z.object({
  sub: AuthResponseSchema.shape.user.shape.id,
  role: AuthResponseSchema.shape.user.shape.role,
  tokenVersion: z.number().int().nonnegative(),
});
type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;

export type VerifyAccessTokenResult =
  | {
      ok: true;
      payload: AccessTokenPayload;
    }
  | {
      ok: false;
      reason: 'expired' | 'invalid-token' | 'invalid-payload';
    };

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET이 설정되어 있지 않습니다.');
  }

  return new TextEncoder().encode(secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<VerifyAccessTokenResult> {
  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    const result = AccessTokenPayloadSchema.safeParse(payload);

    if (!result.success) {
      return { ok: false, reason: 'invalid-payload' };
    }

    return { ok: true, payload: result.data };
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      return { ok: false, reason: 'expired' };
    }

    return { ok: false, reason: 'invalid-token' };
  }
}
