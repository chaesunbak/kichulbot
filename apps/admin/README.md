# Kichulbot Admin

Vite 기반 관리자 프론트엔드입니다.

## Getting Started

루트 디렉터리에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
pnpm install
pnpm --filter @kichulbot/admin dev
```

[http://localhost:3001](http://localhost:3001)에서 관리자 화면을 확인할 수 있습니다. API 기본 주소는 `http://localhost:4000/api`이며 `VITE_API_BASE_URL`로 변경할 수 있습니다.

## Commands

```bash
pnpm -F @admin lint
pnpm -F @admin typecheck
pnpm -F @admin test
pnpm -F @admin build
```

## Structure

```text
apps/admin/
├── public/
├── src/
│   ├── app/
│   │   └── router.tsx
│   ├── features/
│   │   └── (feature)/
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── queries/
│   │       │   ├── keys.ts
│   │       │   ├── options.ts
│   │       │   └── mutations.ts
│   │       ├── schemas.ts
│   │       └── types.ts
│   ├── pages/
│   ├── shared/
│   │   ├── api/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── types.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
