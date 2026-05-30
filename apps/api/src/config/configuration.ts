const DEFAULT_PORT = 4000;
const DEFAULT_WEB_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
const DEFAULT_JWT_EXPIRES_IN = '7d';
const DEFAULT_STORAGE_DRIVER = 'local';
const DEFAULT_STORAGE_PUBLIC_BASE_URL = 'http://localhost:4000/uploads';

function parsePort(value: string | undefined) {
  const port = Number.parseInt(value ?? '', 10);
  return Number.isInteger(port) ? port : DEFAULT_PORT;
}

function parseCsv(value: string | undefined) {
  return value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default () => ({
  app: {
    port: parsePort(process.env.PORT),
    webOrigins: parseCsv(process.env.WEB_ORIGINS) ?? DEFAULT_WEB_ORIGINS,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN,
  },
  storage: {
    driver: process.env.STORAGE_DRIVER ?? DEFAULT_STORAGE_DRIVER,
    publicBaseUrl:
      process.env.STORAGE_PUBLIC_BASE_URL ?? DEFAULT_STORAGE_PUBLIC_BASE_URL,
    local: {
      dir: process.env.STORAGE_LOCAL_DIR ?? `${process.cwd()}/uploads`,
    },
  },
});
