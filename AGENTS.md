# AGENTS.md

## Workspace Overview

```text
kichulbot/
├── apps/
│   ├── api/      # NestJS backend
│   ├── web/      # Next.js user-facing frontend
│   └── admin/    # Next.js admin frontend
└── packages/
    ├── api-contract/       # Shared API types between frontend and backend
    ├── ui/                 # Shared React component library (shadcn/ui-based)
    ├── eslint-config/      # Shared ESLint configurations
    ├── prettier-config/    # Shared Prettier configuration
    └── typescript-config/  # Shared TypeScript tsconfig presets
```

## Backend Structure

The backend app lives in `apps/api`.

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── common/                  # Shared decorators, filters, guards, pipes, DTOs, etc.
├── config/                  # App configuration and environment validation
├── infrastructure/          # Adapters that touch external systems
│   └── database/            # Database adapter
│       ├── database.module.ts
│       ├── database.service.ts
│       ├── schema.prisma
│       └── seed.ts
└── modules/                 # Domain feature modules
    └── auth/
        ├── auth.module.ts
        ├── auth.controller.ts
        ├── auth.service.ts
        ├── users.repository.ts
        ├── decorators/
        ├── dto/
        └── guards/
```
