import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@kichulbot/api-contract/(.+)$':
      '<rootDir>/../../packages/api-contract/src/$1/index.ts',
    '^@kichulbot/api-contract$':
      '<rootDir>/../../packages/api-contract/src/index.ts',
    '^@kichulbot/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.dto.ts',
    '!src/**/dto/**/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json-summary', 'json', 'lcov', 'text', 'clover'],
  testEnvironment: 'node',
  watchman: false,
};

export default config;
