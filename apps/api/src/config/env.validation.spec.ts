import { validateEnvironment } from './env.validation';

const baseConfig = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/kichulbot',
  JWT_SECRET: 'secret',
  RESEND_API_KEY: 're_test',
  RESEND_FROM_EMAIL: 'noreply@example.com',
};

describe('validateEnvironment', () => {
  it('로컬 스토리지 드라이버는 R2 환경 변수 없이 통과한다', () => {
    expect(validateEnvironment({ ...baseConfig })).toEqual(baseConfig);
  });

  it('빈 PORT는 설정하지 않은 값으로 취급한다', () => {
    const config = { ...baseConfig, PORT: '' };

    expect(validateEnvironment(config)).toEqual(config);
  });

  it('로컬 스토리지 드라이버는 R2 환경 변수 형식을 검증하지 않는다', () => {
    const config = {
      ...baseConfig,
      STORAGE_DRIVER: 'local',
      R2_ENDPOINT: 'not-url',
    };

    expect(validateEnvironment(config)).toEqual(config);
  });

  it('알 수 없는 스토리지 드라이버를 거부한다', () => {
    expect(() =>
      validateEnvironment({ ...baseConfig, STORAGE_DRIVER: 'memory' }),
    ).toThrow('STORAGE_DRIVER must be either local or r2');
  });

  it('R2 스토리지 드라이버는 필수 환경 변수를 검증한다', () => {
    expect(() =>
      validateEnvironment({ ...baseConfig, STORAGE_DRIVER: 'r2' }),
    ).toThrow('R2_ENDPOINT environment variable is required');
  });

  it('R2 URL 환경 변수 형식을 검증한다', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        STORAGE_DRIVER: 'r2',
        R2_ENDPOINT: 'not-url',
        R2_ACCESS_KEY_ID: 'access-key',
        R2_SECRET_ACCESS_KEY: 'secret-key',
        R2_BUCKET: 'kichulbot',
        R2_PUBLIC_BASE_URL: 'https://cdn.example.com',
      }),
    ).toThrow('R2_ENDPOINT must be a valid URL');
  });

  it('R2 필수 환경 변수가 모두 있으면 통과한다', () => {
    const config = {
      ...baseConfig,
      STORAGE_DRIVER: 'r2',
      R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
      R2_ACCESS_KEY_ID: 'access-key',
      R2_SECRET_ACCESS_KEY: 'secret-key',
      R2_BUCKET: 'kichulbot',
      R2_PUBLIC_BASE_URL: 'https://cdn.example.com',
    };

    expect(validateEnvironment(config)).toEqual(config);
  });
});
