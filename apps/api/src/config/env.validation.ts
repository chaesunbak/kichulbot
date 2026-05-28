const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'JWT_SECRET'] as const;

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

export function validateEnvironment(config: Record<string, unknown>) {
  for (const key of REQUIRED_ENV_KEYS) {
    assertPresent(config, key);
  }

  assertPort(config.PORT);

  return config;
}
