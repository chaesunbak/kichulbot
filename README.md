# Kichulbot

```text
apps/
  api        NestJS API
  web        Next.js 사용자 웹
  admin      Vite 관리자 웹
  extractor  문제지 추출 worker
packages/
  api-contract
  ui
  utils
```

## 프로젝트 다이어그램

https://s.icepanel.io/yOFWYIl77arJcZ/OjGN

## 요구 사항

- Node.js 22
- pnpm 10.8.1
- Docker 및 Docker Compose

Node 버전은 `.nvmrc`를 기준으로 맞춥니다.

```bash
nvm use
corepack enable
pnpm install
```

## 개발 환경변수

로컬 개발은 앱별 `.env.example`을 복사해서 시작합니다.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env
cp apps/extractor/.env.example apps/extractor/.env
```

## 프로젝트 시작

전체 개발 서버를 한 번에 실행합니다. `extractor` 패키지는 필요한 경우에만 단독으로 실행합니다.

```bash
pnpm dev
```

로컬 URL은 다음과 같습니다.

| 앱    | URL                         |
| ----- | --------------------------- |
| web   | `http://localhost:3000`     |
| admin | `http://localhost:3001`     |
| api   | `http://localhost:4000/api` |

필요한 서비스만 따로 실행할 수도 있습니다.

```bash
pnpm db:up
pnpm db:sync
pnpm db:seed
pnpm -F api dev
pnpm -F web dev
pnpm -F admin dev
pnpm -F extractor dev
```

## 시딩

관리자 계정과 extractor 서비스 계정 생성을 위해 시딩을 진행합니다. `PAPER_IMPORT_SERVICE_TOKEN`을 바꾸거나 서비스 계정 scope가 변경된 경우에도 다시 실행합니다.

```bash
pnpm db:seed
```

## 프로덕션 환경변수

프로덕션 배포는 GitHub Actions와 GitHub Environment를 기준으로 관리합니다.

1. GitHub 저장소의 `Settings`로 이동합니다.
2. `Environments`에서 `production`을 생성합니다.
3. `production` Environment에 Secrets와 Variables를 등록합니다.
4. `main` 브랜치에 push하면 `.github/workflows/production-deploy.yml`이 배포를 수행합니다.

### 필수 Secrets

| 이름                         | 설명                                       |
| ---------------------------- | ------------------------------------------ |
| `ORACLE_HOST`                | 배포 서버 주소                             |
| `ORACLE_USERNAME`            | 배포 서버 SSH 사용자                       |
| `ORACLE_SSH_KEY`             | 배포 서버 SSH private key                  |
| `POSTGRES_PASSWORD`          | PostgreSQL 비밀번호                        |
| `JWT_SECRET`                 | API/Web 서버 JWT 서명 키                   |
| `PAPER_IMPORT_SERVICE_TOKEN` | extractor 서비스 계정 토큰                 |
| `GHCR_USERNAME`              | GHCR 로그인 사용자                         |
| `GHCR_TOKEN`                 | `read:packages` 권한이 있는 GitHub token   |
| `KAKAO_CLIENT_SECRET`        | 카카오 OAuth client secret                 |
| `RESEND_API_KEY`             | Resend API 키                              |
| `R2_ACCESS_KEY_ID`           | Cloudflare R2 access key                   |
| `R2_SECRET_ACCESS_KEY`       | Cloudflare R2 secret key                   |
| `GRAFANA_ADMIN_PASSWORD`     | Grafana 관리자 비밀번호                    |
| `CLOUDFLARE_API_TOKEN`       | Caddy DNS-01 인증서 발급용 Cloudflare 토큰 |

### 주요 Variables

| 이름                                | 예시                                            |
| ----------------------------------- | ----------------------------------------------- |
| `ORACLE_DEPLOY_PATH`                | `/opt/kichulbot`                                |
| `GHCR_OWNER`                        | GitHub owner 이름                               |
| `IMAGE_TAG`                         | `latest`                                        |
| `WEB_DOMAIN`                        | `kichulbot.com`                                 |
| `ADMIN_DOMAIN`                      | `admin.kichulbot.com`                           |
| `API_DOMAIN`                        | `api.kichulbot.com`                             |
| `GRAFANA_DOMAIN`                    | `grafana.kichulbot.com`                         |
| `API_INTERNAL_BASE_URL`             | `http://api:4000/api`                           |
| `NEXT_PUBLIC_SITE_URL`              | `https://kichulbot.com`                         |
| `POSTGRES_USER`                     | `kichulbot`                                     |
| `POSTGRES_DB`                       | `kichulbot`                                     |
| `GRAFANA_ADMIN_USER`                | `admin`                                         |
| `PROMETHEUS_RETENTION_TIME`         | `90d`                                           |
| `PROMETHEUS_RETENTION_SIZE`         | `5GB`                                           |
| `JWT_EXPIRES_IN`                    | `7d`                                            |
| `STORAGE_DRIVER`                    | `r2`                                            |
| `R2_ENDPOINT`                       | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_BUCKET`                         | `<bucket-name>`                                 |
| `R2_PUBLIC_BASE_URL`                | `https://<public-domain>`                       |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog public project token                    |
| `NEXT_PUBLIC_POSTHOG_HOST`          | `https://us.i.posthog.com`                      |
| `KAKAO_CLIENT_ID`                   | 카카오 REST API 키                              |
| `RESEND_FROM_EMAIL`                 | `Kichulbot <noreply@example.com>`               |

## 배포 파일

- `deploy/docker-compose.prod.yml`: 프로덕션 Docker Compose 설정
- `deploy/Caddyfile`: 프로덕션 라우팅 설정
- `deploy/.env.example`: 서버 런타임 env 예시

## 하네스 엔지니어링

- 심볼릭 링크를 사용하여 claude code, codex 등 어떤 툴을 사용하더라도 같은 하네스가 적용되도록 합니다.
- 필요하면 프로젝트에 추가하여 공용으로 사용합니다
- `AGENTS.md`는 200줄 이하로 유지합니다.
