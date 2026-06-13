import { ApiError } from '@kichulbot/api-contract';

import { isRecord } from '@/shared/lib/is-record';

export function assertOkResponse(response: unknown): { ok: true } {
  if (!isRecord(response) || response.ok !== true) {
    throw new ApiError(500, '서버 응답이 올바르지 않습니다.');
  }
  return { ok: true };
}
