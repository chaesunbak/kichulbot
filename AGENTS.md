## Workspace Overview

```text
kichulbot/
├── apps/
│   ├── api/      # NestJS backend
│   ├── web/      # Next.js user-facing frontend
│   ├── admin/    # Vite + react-router admin frontend
│   └── mobile/   # Expo + React Native mobile app
└── packages/
    ├── api-contract/       # Shared API types between frontend and backend
    ├── ui/                 # Shared React component library (shadcn/ui-based)
    ├── eslint-config/
    ├── prettier-config/
    └── typescript-config/
```

## Web Frontend Structure

The user-facing frontend app lives in `apps/web`.

```text
apps/web/
├── public/
├── src/
│   ├── app/
│   │   ├── (group)/
│   │   ├── api/             # Route handlers and backend proxy routes(BFF)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── features/            # Feature modules grouped by domain
│   │   └── (feature)/
│   ├── shared/
│   │   ├── api/
│   │   ├── components/
│   │   └── lib/
│   └── proxy.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Mobile App Structure

The mobile app lives in `apps/mobile`.

The mobile app uses Expo, React Native, NativeWind, and react-native-reusables.

## Backend Structure

The backend app lives in `apps/api`.

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── common/                  # Shared decorators, filters, guards, pipes, DTOs, etc.
├── config/
├── infrastructure/
│   └── database/
│       ├── database.service.ts
│       ├── schema.prisma
│       └── seed.ts
└── modules/
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.service.ts
        ├── users.repository.ts
        ├── decorators/
        ├── dto/
        └── guards/
```

## Turbo Repo

```bash
pnpm turbo run build --filter=@kichulbot/api
pnpm turbo run typecheck --filter=@kichulbot/api
```

## Overlay

use `overlay-kit` to manage overlay elements. reference existing codes.

## Styleing

### No shadow

Never use shadow

### Border

Don't

```
className="border boder-slate-200"
```

Do

```
className="border"
```

## Language

Write commit messages, comments, and test cases in Korean.
