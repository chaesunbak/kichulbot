import { reactConfig } from '@kichulbot/eslint-config/react';

export default reactConfig({
  tailwindEntryPoint: 'src/shared/styles/globals.css',
  tsconfigRootDir: import.meta.dirname,
});
