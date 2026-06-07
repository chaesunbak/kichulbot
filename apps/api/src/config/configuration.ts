const DEFAULT_PORT = 4000;
const DEFAULT_WEB_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
const DEFAULT_JWT_EXPIRES_IN = '7d';
const DEFAULT_STORAGE_DRIVER = 'local';
const DEFAULT_STORAGE_PUBLIC_BASE_URL = 'http://localhost:4000/uploads';
const DEFAULT_MOBILE_OAUTH_REDIRECT_URLS = ['kichulbot://oauth/callback'];

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
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackUrl:
        process.env.KAKAO_CALLBACK_URL ??
        'http://localhost:4000/api/auth/kakao/callback',
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
    },
    webRedirectUrl:
      process.env.AUTH_WEB_REDIRECT_URL ??
      'http://localhost:3000/oauth/callback',
    mobileOAuthRedirectUrls:
      parseCsv(process.env.AUTH_MOBILE_OAUTH_REDIRECT_URLS) ??
      DEFAULT_MOBILE_OAUTH_REDIRECT_URLS,
    passwordResetUrl:
      process.env.AUTH_PASSWORD_RESET_URL ??
      'http://localhost:3000/password-reset',
  },
  storage: {
    driver: process.env.STORAGE_DRIVER ?? DEFAULT_STORAGE_DRIVER,
    publicBaseUrl:
      process.env.STORAGE_PUBLIC_BASE_URL ?? DEFAULT_STORAGE_PUBLIC_BASE_URL,
    local: {
      dir: process.env.STORAGE_LOCAL_DIR ?? `${process.cwd()}/uploads`,
    },
    r2: {
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    },
  },
});
