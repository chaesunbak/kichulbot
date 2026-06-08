# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS deps

ARG TARGETPLATFORM

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/api-contract/package.json ./packages/api-contract/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json

RUN --mount=type=cache,id=pnpm-${TARGETPLATFORM},target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --prefer-offline --store-dir=/pnpm/store

FROM deps AS builder

ARG TARGETPLATFORM
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ARG NEXT_PUBLIC_POSTHOG_HOST

ENV NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=$NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

COPY apps/web ./apps/web
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY packages/api-contract ./packages/api-contract
COPY packages/ui ./packages/ui
COPY packages/utils ./packages/utils

RUN --mount=type=cache,id=turbo-web-${TARGETPLATFORM},target=/app/.turbo,sharing=locked \
    --mount=type=cache,id=next-web-${TARGETPLATFORM},target=/app/apps/web/.next/cache,sharing=locked \
    pnpm turbo run build --filter=@kichulbot/web

FROM node:22-alpine AS runner

ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
