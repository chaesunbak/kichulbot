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
EXPO_PUBLIC_WEB_BASE_URL=http://localhost:3000
```

`EXPO_PUBLIC_` 값은 앱 번들에 노출되므로 민감한 값을 넣지 않습니다.
