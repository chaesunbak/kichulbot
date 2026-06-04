# @kichulbot/mobile

Expo + React Native 기반 기출봇 모바일 앱입니다.

Expo Go 실기기 확인을 위해 Expo SDK 54를 사용합니다.

## 실행

```bash
pnpm --filter @kichulbot/mobile dev
```

## 환경변수

`.env.example`을 기준으로 로컬 환경값을 설정합니다.

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
EXPO_PUBLIC_APP_SCHEME=kichulbot
EXPO_PUBLIC_WEB_BASE_URL=http://localhost:3000
```

`EXPO_PUBLIC_` 값은 앱 번들에 노출되므로 민감한 값을 넣지 않습니다.

## API URL

에뮬레이터와 실기기에서는 `localhost`가 개발 머신이 아닐 수 있습니다.

- iOS Simulator: `http://localhost:4000/api`
- Android Emulator: `http://10.0.2.2:4000/api`
- Expo Go 실기기: 개발 머신의 LAN IP를 사용합니다. 예: `http://192.168.0.10:4000/api`

카카오 로그인 딥링크를 사용하려면 API 환경값에도 모바일 redirect URL을 허용해야 합니다.
앱은 `Linking.createURL('oauth/callback')`으로 redirect URL을 생성합니다.

```bash
AUTH_MOBILE_OAUTH_REDIRECT_URLS=kichulbot://oauth/callback
```

Expo Go 실기기에서는 콘솔에 표시되는 Expo 개발 URL을 기준으로
`exp://.../--/oauth/callback` 값을 추가합니다.
