FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PAPER_IMPORT_STORAGE_DIR="/app/apps/api/uploads"
ENV QUESTION_EXTRACTOR_TOOLS_DIR="/app/apps/extractor/question-extractor"
ENV PAPER_IMPORT_PYTHON_BIN="/opt/question-extractor-venv/bin/python"

WORKDIR /app

RUN corepack enable

FROM base AS deps

ARG TARGETPLATFORM

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/extractor/package.json ./apps/extractor/package.json
COPY packages/api-contract/package.json ./packages/api-contract/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

RUN --mount=type=cache,id=pnpm-extractor-${TARGETPLATFORM},target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --prefer-offline --store-dir=/pnpm/store --filter=@kichulbot/extractor...

FROM deps AS builder

COPY apps/extractor ./apps/extractor
COPY packages/api-contract ./packages/api-contract
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config

RUN pnpm --filter=@kichulbot/api-contract build \
    && pnpm --filter=@kichulbot/extractor build

FROM base AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/extractor/package.json ./apps/extractor/package.json
COPY --from=builder /app/apps/extractor/node_modules ./apps/extractor/node_modules
COPY --from=builder /app/apps/extractor/dist ./apps/extractor/dist
COPY --from=builder /app/apps/extractor/question-extractor ./apps/extractor/question-extractor

RUN python3 -m venv /opt/question-extractor-venv \
    && /opt/question-extractor-venv/bin/pip install --no-cache-dir -r ./apps/extractor/question-extractor/requirements.txt

WORKDIR /app/apps/extractor

CMD ["node", "dist/main.js"]
