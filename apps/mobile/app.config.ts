import type { ConfigContext, ExpoConfig } from 'expo/config';

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';
const webBaseUrl =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'http://localhost:3000';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '기출봇',
  slug: 'kichulbot-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'kichulbot',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.kichulbot.mobile',
    icon: './assets/expo.icon',
  },
  android: {
    ...config.android,
    package: 'com.kichulbot.mobile',
    adaptiveIcon: {
      backgroundColor: '#E8F2FF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    ...config.web,
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-secure-store',
      {
        configureAndroidBackup: true,
        faceIDPermission:
          '기출봇이 인증 정보를 안전하게 확인할 수 있도록 허용합니다.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2563EB',
        image: './assets/images/splash-icon.png',
        imageWidth: 96,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl,
    webBaseUrl,
  },
});
