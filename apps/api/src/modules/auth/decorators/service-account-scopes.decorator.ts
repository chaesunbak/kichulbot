import { SetMetadata } from '@nestjs/common';

export const SERVICE_ACCOUNT_SCOPES_KEY = 'service-account-scopes';

export const ServiceAccountScopes = (...scopes: string[]) =>
  SetMetadata(SERVICE_ACCOUNT_SCOPES_KEY, scopes);
