import { nestConfig } from '@kichulbot/eslint-config/nest';

export default nestConfig({
  ignores: ['src/infrastructure/database/generated/**'],
  tsconfigRootDir: import.meta.dirname,
});
