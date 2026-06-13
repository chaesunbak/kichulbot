import { MeResponseSchema } from '@kichulbot/api-contract/auth';

import { apiRequest } from '@/shared/api/api-client';

export async function fetchMe(token: string) {
  return apiRequest('/me', MeResponseSchema.parse, { token });
}
