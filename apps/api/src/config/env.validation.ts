const REQUIRED_ENV_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
] as const;

function assertPresent(config: Record<string, unknown>, key: string) {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} environment variable is required`);
  }
}

function assertPort(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
}

function assertUrl(config: Record<string, unknown>, key: string) {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} environment variable is required`);
  }

  try {
    new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }
}

function assertStorage(config: Record<string, unknown>) {
  const driver = config.STORAGE_DRIVER ?? 'local';

  if (driver !== 'local' && driver !== 'r2') {
    throw new Error('STORAGE_DRIVER must be either local or r2');
  }

  if (driver !== 'r2') {
    return;
  }

  assertUrl(config, 'R2_ENDPOINT');
  assertPresent(config, 'R2_ACCESS_KEY_ID');
  assertPresent(config, 'R2_SECRET_ACCESS_KEY');
  assertPresent(config, 'R2_BUCKET');
  assertUrl(config, 'R2_PUBLIC_BASE_URL');
}

export function validateEnvironment(config: Record<string, unknown>) {
  for (const key of REQUIRED_ENV_KEYS) {
    assertPresent(config, key);
  }

  assertPort(config.PORT);
  assertStorage(config);

  return config;
}
