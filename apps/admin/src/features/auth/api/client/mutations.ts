import { AuthResponseSchema } from '@kichulbot/api-contract/auth';

import { apiRequest } from '@/shared/api/api-client';

export async function login(email: string, password: string) {
  return apiRequest('/auth/login', AuthResponseSchema.parse, {
    method: 'POST',
    body: { email, password },
  });
}
