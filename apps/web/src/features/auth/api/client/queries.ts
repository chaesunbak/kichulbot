import { clientApi } from '@/shared/api/client';

export async function listAuthConnectionsApi(): Promise<{
  connections: Array<{
    provider: 'KAKAO';
    providerEmail: string | null;
    providerNickname: string | null;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
}> {
  return clientApi.get('/api/me/auth-connections');
}
