# Prisma 7 마이그레이션 패치 계획

## 목적

Prisma ORM 7 업그레이드는 단순 패키지 업데이트가 아니라 Node/TypeScript 런타임, ESM 설정, Prisma Client 생성 위치, PostgreSQL driver adapter, CLI 설정 방식이 함께 바뀌는 작업이다.

이 문서는 현재 `kichulbot` 코드베이스를 기준으로 Prisma 7 이동 시 확정한 정책, 적용 결과, 후속 확인 항목을 정리한다.

공식 문서:

- [Upgrade to Prisma ORM 7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Generating Prisma Client](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client)

## 현재 상태

### 패키지와 런타임

| 항목             | 현재 상태                      | Prisma 7 요구사항 기준               |
| ---------------- | ------------------------------ | ------------------------------------ |
| 로컬 Node.js     | `v22.18.0`                     | 충족                                 |
| pnpm             | `10.8.1`                       | 별도 Prisma 7 제약 없음              |
| `@prisma/client` | `^7.8.0`                       | 충족                                 |
| `prisma` CLI     | `^7.8.0`                       | 충족                                 |
| TypeScript       | `^5.7.2`                       | 최소 `5.4.0` 충족, 권장 `5.9.x` 미만 |
| CI Node.js       | repo 내 `.github`/CI 설정 없음 | 확인 필요                            |
| 배포 Node.js     | repo 내 배포 설정 없음         | 확인 필요                            |

> 이슈 본문에는 Prisma `5.22.0`으로 적혀 있었으나, 작업 시작 시점의 `apps/api/package.json`은 이미 Prisma `^6.19.3` 상태였다. 이번 패치는 그 위에서 `6.19.3 -> 7.8.0` 마이그레이션을 적용했다.

### API 앱 설정

- 앱 위치: `apps/api`
- Prisma schema: `apps/api/src/infrastructure/database/schema.prisma`
- 현재 generator: `provider = "prisma-client"`
- generated client output: `apps/api/src/infrastructure/generated/prisma`
- 현재 datasource: schema에는 `provider = "postgresql"`만 두고, URL은 `prisma.config.ts`에서 관리
- 현재 Prisma 설정 위치: `apps/api/prisma.config.ts`
- 현재 seed: `tsx src/infrastructure/database/seed.ts`
- DB 서비스: `apps/api/src/infrastructure/database/database.service.ts`
- seed 파일: `apps/api/src/infrastructure/database/seed.ts`

### TypeScript와 모듈 시스템

현재 NestJS 공유 TS 설정은 `packages/typescript-config/nestjs.json`에서 다음 값을 사용한다.

```json
{
  "module": "commonjs",
  "target": "ES2021"
}
```

Prisma 7은 ESM 패키지로 제공된다. 공식 가이드의 예시는 `type: "module"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `target: "ES2023"` 방향을 제시하지만, 이 변경은 NestJS CLI, Jest, ts-jest, tsx seed 실행에 영향을 준다.

이번 패치에서는 API 앱의 CommonJS 설정을 유지한 상태로 `typecheck`, `build`, `test`가 모두 통과했다. 따라서 NestJS ESM 전환은 현재 필수 작업이 아니며, 후속 문제가 확인될 때 별도 PR로 분리한다.

### Prisma Client import 범위

작업 전 `apps/api/src`에서 `@prisma/client`를 import하는 파일은 57개였다. 현재는 `apps/api/src/infrastructure/database/prisma-client.ts` barrel을 통해 generated client를 import한다. 주요 사용 범위는 다음과 같다.

- `DatabaseService`와 `seed.ts`의 `PrismaClient`
- Repository/Service의 `Prisma` namespace 및 model type
- Controller/Guard/DTO/spec의 enum type

Prisma 7에서 `prisma-client` generator와 custom output을 사용하므로, 기존 `@prisma/client` import는 모두 generated client barrel 경로로 전환했다.

## 확정 정책

### 1. 업그레이드 기준

- Prisma 6 안정 지점은 이미 도달한 것으로 본다.
- `@prisma/client`와 `prisma`를 같은 major인 `7.8.0`으로 올렸다.
- TypeScript는 현재 최소 요구사항을 충족하므로 Prisma 7 PR의 필수 작업으로 묶지 않는다.
- 다만 Prisma 권장 버전과 맞추는 별도 후속 PR로 TypeScript `5.9.x` 업그레이드를 검토한다.

### 2. ESM 전환 전략

첫 Prisma 7 패치에서는 API 앱 전체 ESM 전환을 독립 위험으로 분리한다.

권장 순서:

1. 현재 CommonJS NestJS 설정에서 Prisma 7 client import, Jest, seed가 동작하는지 먼저 검증한다. 이번 패치에서 typecheck/build/test는 통과했다.
2. 실패 지점이 ESM 로딩 문제로 확인되면 `apps/api`에 한정해 ESM 전환 후보를 만든다.
3. 공유 `@kichulbot/typescript-config/nestjs.json`는 여러 NestJS 앱이 생길 수 있는 공통 설정이므로, Prisma 때문에 바로 바꾸지 않는다.

검토 후보:

```json
{
  "type": "module"
}
```

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023"
  }
}
```

이 후보는 `nest build`, `jest`, `ts-jest`, `tsx` seed까지 통과할 때만 적용한다.

### 3. Prisma Client output 위치

generated client는 schema 파일 기준 상대 경로로 다음 위치를 사용한다.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}
```

결과 위치:

```text
apps/api/src/infrastructure/generated/prisma
```

이 위치를 선택하는 이유:

- `schema.prisma`가 `src/infrastructure/database` 아래에 있어 상대 경로가 단순하다.
- generated client가 API 앱 내부에 머물러 monorepo package 경계를 넘지 않는다.
- `DatabaseService`에서 `../generated/prisma/client`로 접근 가능하다.

주의할 점:

- 현재 구조에서는 modules 하위 파일의 상대 import가 길어질 수 있다.
- 따라서 실제 적용 전에 `@kichulbot/api` 내부 path alias를 둘지, 상대 경로를 허용할지 결정해야 한다.

대안:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../../generated/prisma"
}
```

결과 위치:

```text
apps/api/src/generated/prisma
```

이 대안은 API 전역에서 `src/generated/prisma/client` alias를 붙이기 쉽지만, schema 위치와 generated 위치의 응집도는 낮다.

### 4. generated client 커밋 정책

generated client는 커밋하지 않는다.

추가한 gitignore:

```gitignore
apps/api/src/infrastructure/generated/prisma/
```

이유:

- 기존 프로젝트는 generated Prisma Client를 `node_modules` 산출물로 취급해 왔다.
- generated TypeScript 코드 커밋은 diff가 커지고 리뷰 노이즈가 커질 수 있다.
- `prisma:generate`, `build`, `typecheck`, CI 단계에서 생성하면 충분하다.

단, 배포 환경에서 install 이후 `prisma generate`가 실행되지 않는다면 커밋 정책을 재검토한다.

### 5. import 경로 정책

generated client import는 한 곳으로 감싸는 barrel 파일을 둔다.

파일:

```text
apps/api/src/infrastructure/database/prisma-client.ts
```

코드:

```ts
export * from '../generated/prisma/client';
```

적용 결과:

- 기존 `@prisma/client` import 57개를 `apps/api/src/infrastructure/database/prisma-client`에서 가져오도록 일괄 변경했다.
- 상대 경로가 길어지는 파일은 있지만, 현재 별도 alias 없이 typecheck/build/test가 통과한다.
- enum/model type과 `Prisma` namespace가 모두 같은 barrel에서 export되는지 `prisma:generate` 후 확인한다.

### 6. PostgreSQL driver adapter

Prisma 7에서는 PostgreSQL 연결에 `@prisma/adapter-pg`와 `pg`를 사용한다.

적용 패키지:

```bash
pnpm --filter @kichulbot/api add @prisma/adapter-pg pg
pnpm --filter @kichulbot/api add -D @types/pg
```

`DatabaseService` 적용 방향:

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './prisma-client';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`seed.ts` 적용 방향:

```ts
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, UserAuthType, UserRole } from './prisma-client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
```

남은 확인:

- `@nestjs/config`가 `DatabaseService` constructor 주입에 이미 사용 가능한지 확인한다.
- `pg` 기본 pool timeout은 기존 Prisma Rust engine과 다를 수 있으므로, 부하 테스트 전까지 기본값 변경을 최소화한다.
- 운영 DB가 SSL을 요구한다면 `pg` SSL 옵션을 별도로 주입할 수 있는 설정 구조가 필요하다.

### 7. `prisma.config.ts`

Prisma CLI 설정은 `apps/api/prisma.config.ts`로 옮겼다.

적용 코드:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'src/infrastructure/database/schema.prisma',
  migrations: {
    seed: 'tsx src/infrastructure/database/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

적용 결과:

- `apps/api/package.json`의 `prisma` 필드는 제거했다.
- Prisma 명령은 `pnpm --filter @kichulbot/api prisma ...` 형태를 유지한다.
- monorepo filter 명령이 `apps/api` cwd에서 실행되어 `prisma.config.ts`를 찾는 것을 `prisma generate`로 검증했다.

### 8. scripts 변경

Prisma 7에서는 `db push` 이후 generate를 명시적으로 실행하는 흐름을 둔다.

`apps/api/package.json` 적용:

```json
{
  "scripts": {
    "build": "prisma generate && nest build",
    "typecheck": "prisma generate && tsc -p tsconfig.json --noEmit",
    "test": "prisma generate && jest",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push --accept-data-loss",
    "prisma:sync": "prisma db push --accept-data-loss && prisma generate",
    "seed": "prisma db seed"
  }
}
```

root `package.json` 적용:

```json
{
  "scripts": {
    "db:sync": "pnpm --filter @kichulbot/api prisma:sync"
  }
}
```

주의:

- package script 내부 `&&`는 현재 root script에서도 이미 사용 중이므로 추가 위험은 낮다.
- generated client를 커밋하지 않으므로 `typecheck`/`build`/`test`는 각각 `prisma generate`를 먼저 실행한다.

## 이번 패치 적용 범위

### 적용 완료

- 이 문서를 추가했다.
- `prisma`, `@prisma/client`를 `^7.8.0`으로 올렸다.
- `@prisma/adapter-pg`, `pg`, `@types/pg`를 추가했다.
- `apps/api/prisma.config.ts`를 추가하고 `apps/api/package.json`의 `prisma` 필드를 제거했다.
- generator를 `prisma-client`와 custom output으로 바꿨다.
- generated client barrel 파일을 추가했다.
- 기존 `@prisma/client` import 57개를 새 barrel 경로로 일괄 변경했다.
- generated client gitignore 정책을 적용했다.
- `DatabaseService`와 `seed.ts`에서 PostgreSQL driver adapter 기반 `PrismaClient`를 생성하도록 바꿨다.
- `db:sync`, `typecheck`, `build`, `test` 흐름에서 `prisma generate`가 빠지지 않도록 scripts를 바꿨다.

### 보류

- NestJS API의 `type: "module"` 전환은 보류한다.
- `module: "ESNext"`, `moduleResolution: "bundler"`, `target: "ES2023"` 전환도 보류한다.
- 현재 CommonJS 설정으로 `prisma generate`, `typecheck`, `build`, `test`가 통과했으므로 ESM 전환은 별도 필요가 생겼을 때 독립 PR로 진행한다.

## 검증 명령

이번 패치에서 다음 명령을 검증했다.

```bash
pnpm --filter @kichulbot/api prisma:generate
pnpm turbo run typecheck --filter=@kichulbot/api
pnpm turbo run build --filter=@kichulbot/api
pnpm --filter @kichulbot/api test
pnpm db:up
pnpm db:sync
pnpm --filter @kichulbot/api seed
```

`pnpm db:up`, `pnpm db:sync`, `pnpm --filter @kichulbot/api seed`는 로컬 PostgreSQL 컨테이너와 `.env` 준비가 선행되어야 하므로 이번 검증에서는 제외했다.

## 남은 확인 항목

- CI Node.js 버전: repo 내 설정 없음
- 배포 Node.js 버전: repo 내 설정 없음
- 운영 DB SSL 요구사항
- 운영 DB SSL 요구사항에 맞는 `pg` SSL 옵션
- 배포 환경에서 `prisma generate` 실행 시점
- API 앱 내부 import alias 도입 여부

## 이슈 완료 조건 매핑

- Prisma 7 요구사항 충족 여부 문서화: 로컬 Node와 TypeScript는 확인 완료, CI/배포는 확인 필요로 명시
- 마이그레이션에 필요한 패키지 목록 확정 및 적용: `@prisma/adapter-pg`, `pg`, `@types/pg`, `prisma@7`, `@prisma/client@7`
- `prisma.config.ts` 설계 확정 및 적용
- generated client output/import 정책 확정 및 적용
- PostgreSQL adapter 적용 방식 확정 및 적용
- scripts 변경안 확정 및 적용
- NestJS ESM 전환 여부 확인: 현재 CommonJS 유지
