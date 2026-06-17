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
  const res = await clientApi.get<{
    data: {
      connections: Array<{
        provider: 'KAKAO';
        providerEmail: string | null;
        providerNickname: string | null;
        lastLoginAt: string | null;
        createdAt: string;
      }>;
    };
  }>('/api/me/auth-connections');
  return res.data;
}
