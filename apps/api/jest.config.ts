import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@kichulbot/api-contract/(.+)$':
      '<rootDir>/../../packages/api-contract/src/$1/index.ts',
    '^@kichulbot/api-contract$':
      '<rootDir>/../../packages/api-contract/src/index.ts',
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  watchman: false,
};

export default config;
