## Workspace Overview

This is a pnpm + Turbo monorepo.

- `apps/api`: NestJS backend. See `apps/api/README.md`.
- `apps/web`: Next.js user-facing frontend. See `apps/web/README.md`.
- `apps/admin`: Vite + React Router admin frontend. See `apps/admin/README.md`.
- `apps/extractor`: extraction worker and Python question extraction utilities.
- `packages/api-contract`: shared API types between frontend and backend.
- `packages/ui`: shared React component library based on shadcn/ui.
- `packages/utils`: shared utilities.
- `packages/eslint-config`, `packages/prettier-config`, `packages/typescript-config`: shared tooling configs.

## Turbo Repo

```bash
pnpm turbo run build --filter=@kichulbot/api
pnpm turbo run typecheck --filter=@kichulbot/api
```

## Shell

- Quote paths with single quotes in shell commands to prevent glob expansion.

## Frontend

### Overlay

use `overlay-kit` to manage overlay elements. reference existing codes.

### Styling

#### No shadow

Never use shadow except overlays(e.g. Select)

#### Border

Don't `className="border boder-slate-200"` Do `className="border"`

## Code Smell Reporting

If you spot code smell unrelated to the current task, report it.

## Commit Message

Write the first line as:

```text
type: message
```

Additional body lines are allowed when they clarify context, reasoning, or follow-up work.

## Language

Write commit messages, comments, and test cases in Korean.
