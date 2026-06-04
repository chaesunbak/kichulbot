import { reactNativeConfig } from '@kichulbot/eslint-config/react-native';

export default reactNativeConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: [
    '.expo/**',
    'dist/**',
    'web-build/**',
    'babel.config.js',
    'expo-env.d.ts',
    'metro.config.js',
    'nativewind-env.d.ts',
    'tailwind.config.js',
  ],
});
