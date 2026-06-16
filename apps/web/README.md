# Kichulbot Web

Next.js 기반 사용자용 프론트엔드입니다.

## Getting Started

루트 디렉터리에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
pnpm install
pnpm --filter @kichulbot/web dev
```

[http://localhost:3000](http://localhost:3000)에서 사용자 화면을 확인할 수 있습니다.

## Commands

```bash
pnpm --filter @kichulbot/web lint
pnpm --filter @kichulbot/web typecheck
pnpm --filter @kichulbot/web test
pnpm --filter @kichulbot/web build
```

## Structure

```text
apps/web/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/          # 인증 관련 라우트 그룹
│   │   ├── (main)/          # 주요 사용자 화면 라우트 그룹
│   │   ├── (solve)/         # 문제 풀이 라우트 그룹
│   │   ├── api/             # Route handlers and backend proxy routes(BFF)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── features/            # 도메인별 feature modules
│   │   └── (feature)/
│   │       ├── api/
│   │       ├── components/
│   │       └── lib/
│   ├── shared/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   └── lib/
│   └── proxy.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```
