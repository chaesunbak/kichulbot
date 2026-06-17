# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS deps

ARG TARGETPLATFORM

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/api-contract/package.json ./packages/api-contract/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/utils/package.json ./packages/utils/package.json

RUN --mount=type=cache,id=pnpm-${TARGETPLATFORM},target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --prefer-offline --store-dir=/pnpm/store

FROM deps AS builder

ARG TARGETPLATFORM
ENV DATABASE_URL="postgresql://kichulbot:kichulbot@localhost:5432/kichulbot?schema=public"

COPY apps/api ./apps/api
COPY packages/api-contract ./packages/api-contract
COPY packages/typescript-config ./packages/typescript-config
COPY packages/utils ./packages/utils

RUN --mount=type=cache,id=turbo-api-${TARGETPLATFORM},target=/app/.turbo,sharing=locked \
    pnpm turbo run build --filter=@kichulbot/api
RUN CI=true pnpm prune --prod --ignore-scripts
RUN --mount=type=cache,id=pnpm-${TARGETPLATFORM},target=/pnpm/store,sharing=locked \
    pnpm install --prod --frozen-lockfile --prefer-offline --store-dir=/pnpm/store --filter=@kichulbot/api... --ignore-scripts

FROM node:22-alpine AS runner

ENV NODE_ENV="production"
ENV PORT="4000"

RUN corepack enable

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/infrastructure/database/schema.prisma ./apps/api/src/infrastructure/database/schema.prisma
COPY --from=builder /app/apps/api/src/infrastructure/database/migrations ./apps/api/src/infrastructure/database/migrations
COPY --from=builder /app/apps/api/src/infrastructure/database/generated/prisma ./apps/api/src/infrastructure/database/generated/prisma
COPY --from=builder /app/packages/api-contract ./packages/api-contract
COPY --from=builder /app/packages/utils ./packages/utils

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/src/main"]
