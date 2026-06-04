export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api',
  webBaseUrl: process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'http://localhost:3000',
} as const;
