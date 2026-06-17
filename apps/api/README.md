# Kichulbot API

NestJS 기반 백엔드입니다.

## Getting Started

루트 디렉터리에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
pnpm install
pnpm --filter @kichulbot/api dev
```

기본 포트는 `4000`이며, 기본 웹 origin은 `http://localhost:3000,http://localhost:3001`입니다.

## API Path Policy

- `/public/*`: 인증 없이 접근 가능한 공개 API입니다. 토큰 여부에 따라 응답 형태가 바뀌면 안 됩니다.
- `/me/*`: 로그인한 사용자 본인 리소스 API입니다. 항상 현재 사용자 기준으로 동작합니다.
- `/admin/*`: 관리자 전용 API입니다. 관리자 데이터 조회와 생성/수정/삭제는 이 접두사를 사용합니다.

## Commands

```bash
pnpm --filter @kichulbot/api lint
pnpm --filter @kichulbot/api typecheck
pnpm --filter @kichulbot/api test
pnpm --filter @kichulbot/api build
```

Turbo로 실행할 때는 다음 명령을 사용합니다.

```bash
pnpm turbo run build --filter=@kichulbot/api
pnpm turbo run typecheck --filter=@kichulbot/api
```

## Structure

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── common/                  # 공통 decorator, filter, interceptor, DTO 등
├── config/
├── infrastructure/
│   ├── database/
│   │   ├── database.service.ts
│   │   ├── generated/       # Prisma generated output
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── storage/
├── modules/
│   └── (module)/
│       ├── dto/
│       ├── *.controller.ts
│       ├── *.module.ts
│       ├── *.repository.ts
│       └── *.service.ts
└── types/
```
