# Technical Design

## 목표

이 문서는 배포 환경에서 테스트 가능한 MVP를 구현하기 위한 기술 구조를 정의한다.

MVP는 Next.js 웹 앱, NestJS API 서버, Prisma 기반 PostgreSQL 데이터베이스, 오브젝트 스토리지로 구성한다. 로컬에서도 개발 가능해야 하지만, 1차 검증은 실제 배포 환경에서 문제 등록, 문제 풀이, 답안 저장, 태그별 약점 분석, 오답 복습이 동작하는지 확인하는 데 집중한다.

## 기술 스택

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

역할:

- 사용자 화면 제공
- 관리자 화면 제공
- 문제 이미지 표시
- 문제 풀이와 답안 제출
- 약점 분석과 오답 복습 화면 표시

### Backend

- NestJS
- TypeScript
- Prisma
- Multer
- JWT 기반 인증

역할:

- 인증 처리
- 문제지, 문제, 태그 관리
- 이미지 업로드와 R2 저장
- 답안 기록 저장
- 약점 분석 API 제공
- 오답 복습 API 제공

### Database

MVP는 PostgreSQL + Prisma로 시작한다.

이유:

- 실제 배포 환경과 유사한 관계형 DB 구조로 시작할 수 있다.
- 다대다 태그, 답안 기록, 분석 쿼리 구조를 처음부터 명확하게 검증할 수 있다.
- 나중에 협업자와 함께 개발하거나 배포를 준비할 때 DB 전환 비용이 적다.

배포 환경에서는 Render Postgres를 사용한다. 로컬 개발에서는 Docker Compose로 PostgreSQL을 실행한다.

풀이 이력과 오답 복습 확장을 위한 목표 스키마는 [QuestionSet 기반 풀이 도메인 재설계](./04-solving-domain-redesign.md)를 기준으로 한다. 현재 구현의 `Paper`, `Question`, `BookmarkList`, `AnswerSession`, `Answer`는 단계별 이관 전의 MVP 모델이며, 신규 복습 기능은 목표 스키마로 전환한 뒤 확장한다.

### File Storage

문제 이미지는 DB에 저장하지 않고 오브젝트 스토리지에 저장한다.

```txt
questions/
  {questionId}.{ext}
```

배포 환경에서는 Cloudflare R2를 사용한다. R2는 S3 호환 API를 제공하므로, NestJS에서는 S3 SDK 기반 `StorageService`로 추상화한다.

DB에는 이미지 파일의 public URL을 저장한다.

## 로컬 개발 구조

```txt
kichulbot/
  apps/
    web/                  # Next.js
    api/                  # NestJS
  docs/
    00-product-brief.md
    01-mvp-spec.md
    02-technical-design.md
  docker-compose.yml      # 로컬 PostgreSQL
  package.json
  pnpm-workspace.yaml
```

## 실행 포트

- Next.js: `http://localhost:3000`
- NestJS: `http://localhost:4000`
- PostgreSQL: `localhost:5432`
- API prefix: `http://localhost:4000/api`
- 배포 이미지 URL: Cloudflare R2 public URL

## 배포 아키텍처

MVP는 처음부터 배포 환경에서 테스트한다.

### 결정된 구성

- Frontend: Vercel
- Backend API: Render Web Service
- Database: Render Postgres
- Object Storage: Cloudflare R2
- Source Control: GitHub

### 요청 흐름

```txt
Browser
  -> Vercel Next.js
  -> Render NestJS API
  -> Render Postgres
  -> Cloudflare R2
```

### 역할 분리

#### Vercel

Next.js 웹 앱을 배포한다.

담당:

- 사용자 화면
- 관리자 화면
- Preview Deployment
- Production Deployment
- `NEXT_PUBLIC_API_BASE_URL` 환경 변수 관리

#### Render

NestJS API 서버를 배포한다.

담당:

- REST API
- 인증과 JWT 발급
- Prisma Client 실행
- Render Postgres 연결
- R2 이미지 업로드
- Health check endpoint

NestJS는 production 환경에서 `NODE_ENV=production`으로 실행한다.

#### Render Postgres

서비스 데이터베이스로 사용한다.

담당:

- 사용자
- 문제지
- 문제
- 태그
- 내 책장
- 답안 세션
- 답안 로그

Render의 NestJS API와 Render Postgres는 같은 계정과 리전에 배치한다. API 서버는 가능하면 Render Postgres의 internal URL로 연결한다. internal URL은 Render 내부 네트워크를 사용하므로 외부 URL보다 지연 시간이 낮고, 공개 인터넷 노출을 줄일 수 있다.

MVP에서는 connection pooling을 별도로 두지 않는다. 연결 수가 문제가 되면 Render PgBouncer 구성을 검토한다.

#### Cloudflare R2

문제 이미지 저장소로 사용한다.

담당:

- 문제 이미지 원본 저장
- S3 호환 API 제공
- public URL 기반 이미지 제공

MVP에서는 문제 이미지를 public URL로 제공한다. 저작권이나 접근 제한 이슈가 생기면 이후 signed URL 방식으로 전환한다.

## 배포 환경

### Environments

초기에는 두 환경만 둔다.

- Preview: PR 또는 개발 브랜치 테스트
- Production: 실제 MVP 테스트 URL

Staging은 MVP 이후에 추가한다.

### 도메인

초기에는 플랫폼 기본 도메인을 사용한다.

- Web: Vercel 기본 도메인
- API: Render 기본 도메인
- Image: R2 public URL

커스텀 도메인은 MVP 검증 이후 연결한다.

### CORS

NestJS API는 허용된 웹 origin만 요청을 받는다.

허용 origin:

- Vercel production URL
- Vercel preview URL 패턴
- 로컬 개발 URL: `http://localhost:3000`

MVP에서는 환경 변수 `WEB_ORIGINS`에 쉼표로 구분해 관리한다.

## 인증 설계

MVP에서는 게스트 시작과 이메일/비밀번호 기반 인증을 함께 사용한다.

### 포함

- 게스트 시작
- 게스트 사용자 기록 저장
- 게스트 사용자의 이메일 계정 전환
- 이메일 회원가입
- 로그인
- 로그아웃
- JWT access token 발급
- 로그인 사용자 정보 조회
- access token은 `Authorization: Bearer {accessToken}` 헤더로 전달

### 클라이언트별 토큰 경계

NestJS API는 리소스 요청에서 `Authorization: Bearer {accessToken}`만 검증한다.

- Web Browser: Next BFF가 NestJS API의 access token을 `httpOnly`, `Secure`, `SameSite=Lax` 쿠키에 저장한다. 브라우저 JavaScript에는 JWT를 반환하거나 `localStorage`에 저장하지 않는다.
- Web BFF: 쿠키의 access token을 NestJS API 요청의 Bearer 헤더로 전달한다. 쿠키 기반 쓰기 요청은 same-origin `Origin` 헤더를 검증한다.
- Native App: NestJS API 로그인 API를 직접 호출해 받은 access token을 iOS Keychain 또는 Android Keystore 기반 secure storage에 저장하고 Bearer 헤더로 전달한다.
- Admin Web: 현재는 NestJS API를 직접 호출하는 별도 관리 도구이므로 기존 Bearer token 흐름을 유지한다.

현재 단계에서는 refresh token을 도입하지 않는다. access token이 만료되면 다시 로그인한다. refresh token rotation과 서버 측 세션 폐기 정책은 별도 작업으로 다룬다.

### 제외

- 소셜 로그인
- 이메일 인증 메일 발송
- 비밀번호 재설정
- refresh token

MVP에서는 access token 기반으로 사용자별 답안 기록이 분리되는지 검증한다. 이메일 인증은 이후 migration으로 `emailVerifiedAt`와 인증 토큰 테이블을 추가해 확장한다.

## 권한 설계

사용자는 두 역할을 가진다.

- `USER`: 문제 풀이, 내 책장, 약점 분석, 오답 복습
- `ADMIN`: 문제지 등록, 문제 등록, 문제 수정, 태그 관리

MVP에서는 `role` 필드 기반으로 관리자 권한을 구분한다. 초기 관리자 계정은 seed로 생성하고, 이후 필요하면 DB에서 사용자 `role`을 `ADMIN`으로 변경한다.

## 이미지 저장 설계

관리자가 문제 이미지를 업로드하면 API 서버가 파일을 Cloudflare R2에 저장한다.

저장 규칙:

- 허용 확장자: `png`, `jpg`, `jpeg`, `webp`
- object key: `questions/{questionId}.{ext}`
- 최대 파일 크기: MVP에서는 5MB
- API 서버는 업로드만 담당하고, 이미지는 R2 URL로 제공한다.

object key 예시:

```txt
questions/question_001.png
```

DB 저장값 예시:

```txt
https://{r2-public-domain}/questions/question_001.png
```

프론트엔드는 DB에 저장된 `imageUrl`을 사용해 이미지를 표시한다.

StorageService는 다음 메서드를 제공한다.

- `uploadQuestionImage(file, questionId)`
- `getPublicUrl(objectKey)`
- `deleteObject(objectKey)`

로컬 개발에서도 가능하면 R2 개발 버킷을 사용한다. 네트워크 없이 개발해야 하는 경우에만 로컬 파일 저장 어댑터를 별도로 둔다.

## 현재 구현 도메인 모델

이 절은 단계별 이관 전 MVP 구현을 설명한다. 복습 기능 확장을 위한 목표 모델은 [QuestionSet 기반 풀이 도메인 재설계](./04-solving-domain-redesign.md)를 따른다.

### User

서비스 사용자.

게스트 사용자도 `User`로 생성한다. 게스트가 이메일 회원가입을 완료하면 기존 `User`의 `authType`을 `EMAIL`로 바꾸고, 이메일과 비밀번호 해시를 추가한다. 이렇게 하면 게스트 상태에서 만든 내 책장, 답안 기록, 오답 문제지가 그대로 유지된다.

주요 필드:

- `id`
- `email`
- `passwordHash`
- `nickname`
- `authType`
- `role`
- `createdAt`
- `updatedAt`

### Exam

시험 단위. 예: 수능.

주요 필드:

- `id`
- `name`

### Subject

과목 단위. 예: 한국사, 영어.

주요 필드:

- `id`
- `examId`
- `name`

### Paper

1개년 문제지 단위.

예: 2025학년도 수능 한국사.

주요 필드:

- `id`
- `examId`
- `subjectId`
- `title`
- `year`
- `round`
- `questionCount`
- `createdAt`
- `updatedAt`

### Question

문제 단위. MVP에서는 문제 본문과 선택지를 하나의 이미지로 저장한다.

객관식 선택지 텍스트는 별도로 저장하지 않고 `choiceCount`만 저장한다. 이후 서술형 문제 확장을 고려해 답안 형식은 장기적으로 객관식 전용 모델에 묶지 않는다.

주요 필드:

- `id`
- `paperId`
- `number`
- `imageUrl`
- `choiceCount`
- `answer`
- `createdAt`
- `updatedAt`

### Tag

문제 분류 태그.

MVP에서는 시대 태그만 사용하지만, 구조는 여러 태그 타입을 지원한다.

주요 필드:

- `id`
- `type`
- `name`

예시:

- `type`: `ERA`
- `name`: `조선`

### QuestionTag

문제와 태그의 다대다 연결.

주요 필드:

- `questionId`
- `tagId`

### UserPaper

사용자가 내 책장에 추가한 문제지.

주요 필드:

- `id`
- `userId`
- `paperId`
- `addedAt`

### AnswerSession

사용자의 한 번의 문제지 풀이 또는 오답 복습 시도.

주요 필드:

- `id`
- `userId`
- `paperId`
- `mode`
- `startedAt`
- `submittedAt`

`mode` 예시:

- `ONE_BY_ONE`
- `EXAM`

### Answer

사용자의 문항별 답안. 제출 전에는 수정 가능한 임시 답안으로 사용하고, 제출 후에는 확정된 풀이 기록으로 유지한다.

주요 필드:

- `sessionId`
- `questionId`
- `answerChoice`
- `answerText`
- `isCorrect`
- `spentMilliseconds`
- `updatedAt`

최종 제출 전 새로고침이나 화면 이동이 발생해도 사용자의 선택 답안을 복원하기 위해 사용한다. 최종 제출 시 `isCorrect`를 계산해 확정하고, 이후에는 수정하지 않는다.

### WrongQuestionSet

매일 갱신되는 사용자별 오답 문제지.

주요 필드:

- `id`
- `userId`
- `date`
- `createdAt`

### WrongQuestionSetItem

오답 문제지와 문제의 연결.

주요 필드:

- `setId`
- `questionId`

## 현재 구현 Prisma Schema 메모

아래 스키마는 MVP 구현의 전환 전 형태를 설명한다. `QuestionRevision`, `QuestionSet`, `SolveSessionItem`, `DraftResponse`, `QuestionAttempt`를 포함한 목표 스키마와 이관 순서는 [QuestionSet 기반 풀이 도메인 재설계](./04-solving-domain-redesign.md)를 따른다.

```prisma
enum UserRole {
  USER
  ADMIN
}

enum UserAuthType {
  ANONYMOUS
  EMAIL
}

enum TagType {
  ERA
}

enum AnswerSessionMode {
  ONE_BY_ONE
  EXAM
}

model User {
  id           String       @id @default(cuid())
  email        String?      @unique
  passwordHash String?
  nickname     String?
  authType     UserAuthType @default(ANONYMOUS)
  role         UserRole     @default(USER)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  papers        UserPaper[]
  sessions      AnswerSession[]
  wrongSets     WrongQuestionSet[]
}

model Exam {
  id       String    @id @default(cuid())
  name     String    @unique
  subjects Subject[]
  papers   Paper[]
}

model Subject {
  id     String @id @default(cuid())
  examId String
  name   String

  exam   Exam   @relation(fields: [examId], references: [id])
  papers Paper[]

  @@unique([examId, name])
}

model Paper {
  id            String   @id @default(cuid())
  examId        String
  subjectId     String
  title         String
  year          Int
  round         String?
  questionCount Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  exam      Exam      @relation(fields: [examId], references: [id])
  subject   Subject   @relation(fields: [subjectId], references: [id])
  questions Question[]
  userPapers UserPaper[]
  sessions  AnswerSession[]
}

model Question {
  id          String   @id @default(cuid())
  paperId     String
  number      Int
  imageUrl    String
  choiceCount Int      @default(5)
  answer      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  paper      Paper         @relation(fields: [paperId], references: [id])
  tags       QuestionTag[]
  answers Answer[]
  wrongSetItems WrongQuestionSetItem[]

  @@unique([paperId, number])
}

model Tag {
  id   String  @id @default(cuid())
  type TagType
  name String

  questions QuestionTag[]

  @@unique([type, name])
}

model QuestionTag {
  questionId String
  tagId      String

  question Question @relation(fields: [questionId], references: [id])
  tag      Tag      @relation(fields: [tagId], references: [id])

  @@id([questionId, tagId])
}

model UserPaper {
  id      String   @id @default(cuid())
  userId  String
  paperId String
  addedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id])
  paper Paper @relation(fields: [paperId], references: [id])

  @@unique([userId, paperId])
}

model AnswerSession {
  id          String            @id @default(cuid())
  userId      String
  paperId     String
  mode        AnswerSessionMode
  startedAt   DateTime          @default(now())
  submittedAt DateTime?

  user       User        @relation(fields: [userId], references: [id])
  paper      Paper       @relation(fields: [paperId], references: [id])
  answers Answer[]
}

model Answer {
  sessionId         String
  questionId        String
  answerChoice      Int?
  answerText        String?
  isCorrect         Boolean?
  spentMilliseconds Int      @default(0)
  updatedAt         DateTime @updatedAt

  session  AnswerSession @relation(fields: [sessionId], references: [id])
  question Question      @relation(fields: [questionId], references: [id])

  @@id([sessionId, questionId])
}

model WrongQuestionSet {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime
  createdAt DateTime @default(now())

  user  User                   @relation(fields: [userId], references: [id])
  items WrongQuestionSetItem[]

  @@unique([userId, date])
}

model WrongQuestionSetItem {
  setId      String
  questionId String

  set      WrongQuestionSet @relation(fields: [setId], references: [id])
  question Question         @relation(fields: [questionId], references: [id])

  @@id([setId, questionId])
}
```

## API 설계

API prefix는 `/api`를 사용한다.

### Auth

#### `POST /api/auth/anonymous`

게스트 사용자를 생성하고 access token을 발급한다.

Response:

- `user`
- `accessToken`

#### `POST /api/auth/register`

회원가입.

Authorization header 없이 호출하면 새 이메일 사용자를 생성한다.

Request:

- `email`
- `password`
- `nickname`

Response:

- `user`
- `accessToken`

#### `POST /api/auth/convert`

현재 게스트 사용자를 이메일 계정으로 전환한다.

Authorization: `Bearer {anonymousAccessToken}`

Request:

- `email`
- `password`
- `nickname`

Response:

- `user`
- `accessToken`

#### `POST /api/auth/login`

로그인.

Request:

- `email`
- `password`

Response:

- `user`
- `accessToken`

#### `GET /api/auth/me`

현재 로그인 사용자 조회.

Response:

- `user`

### Web BFF Auth

웹 브라우저는 NestJS API의 인증 응답을 직접 사용하지 않고 Next Route Handler를 호출한다.

- `POST /api/auth/anonymous`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

로그인, 회원가입, 게스트 시작 응답은 브라우저에 `user`만 반환한다. access token은 Next BFF의 `httpOnly` 쿠키에만 저장한다. 리소스별 Route Handler는 공통 프록시를 사용하며, 허용된 경로와 HTTP method만 NestJS API로 전달한다.

### Papers

#### `GET /api/papers`

등록된 문제지 목록 조회.

#### `POST /api/papers`

관리자 문제지 등록.

#### `GET /api/papers/:paperId`

문제지 상세와 문항 목록 조회.

#### `POST /api/me/papers`

문제지를 내 책장에 추가.

Request:

- `paperId`

#### `GET /api/me/papers`

내 책장 문제지 목록 조회.

### Questions

#### `POST /api/admin/questions`

관리자 문제 등록.

Content-Type: `multipart/form-data`

Fields:

- `paperId`
- `number`
- `image`
- `choiceCount`
- `answer`
- `tagIds`

#### `PATCH /api/admin/questions/:questionId`

관리자 문제 수정.

### Tags

#### `GET /api/tags`

태그 목록 조회.

#### `POST /api/admin/tags`

관리자 태그 생성.

### Answer Sessions

#### `POST /api/answer-sessions`

문제지 풀이 세션 시작.

Request:

- `paperId`
- `mode`

Response:

- `sessionId`

#### `POST /api/answer-sessions/:sessionId/submit`

문제지 답안 제출.

Response:

- `sessionId`
- `score`
- `totalCount`
- `correctCount`
- `wrongCount`
- `results`

#### `PATCH /api/answer-sessions/:sessionId/answers/:questionId`

문항별 답안과 풀이 시간 저장. 제출 전에는 동일 문항의 답안을 수정할 수 있다.

Request:

- `answerChoice`
- `answerText`
- `spentMilliseconds`

Response:

- `answer`

#### `GET /api/answer-sessions/:sessionId`

풀이 세션, 문항 목록, 저장된 답안 목록 조회.

Response:

- `answers`: `{ questionId, selectedAnswer }[]`

### Analytics

#### `GET /api/me/analytics/tags`

로그인 사용자의 태그별 약점 분석 조회.

Response:

- `tagId`
- `tagName`
- `solvedCount`
- `correctCount`
- `wrongCount`
- `accuracy`

### Review

#### `GET /api/me/wrong-questions`

로그인 사용자의 오답 문제 목록 조회.

MVP에서는 오늘 날짜의 오답 문제지를 반환한다.

#### `POST /api/answer-sessions/wrong-review`

오답 복습 세션 시작.

Request:

- `paperId`

Response:

- `sessionId`
- `questions`

#### `POST /api/me/wrong-question-sets/today/refresh`

오늘의 오답 문제지를 갱신한다.

Response:

- `setId`
- `date`
- `questions`

## 약점 분석 계산 방식

전환 전 MVP에서는 제출이 완료된 `AnswerSession`의 `Answer`를 기준으로 태그별 정답률을 계산한다. 목표 스키마 전환 후에는 append-only `QuestionAttempt`를 기준으로 집계한다.

계산 기준:

- 사용자가 제출한 모든 답안 기록을 대상으로 한다.
- 한 문제에 태그가 여러 개 있으면 각 태그 집계에 모두 반영한다.
- `accuracy = correctCount / solvedCount`
- `solvedCount`가 낮은 태그는 표시하되, 약점 판단에는 주의 문구를 둘 수 있다.

초기 약점 정렬:

1. 오답 수가 많은 태그
2. 정답률이 낮은 태그

## 답안 저장 기준

전환 전 MVP에서는 문항 선택 시 `Answer`를 upsert한다. 목표 스키마 전환 후에는 `DraftResponse`만 upsert하고, 채점 결과는 append-only `QuestionAttempt`로 추가한다.

기준:

- 세션당 문제 1개에 임시 답안 1개만 유지한다.
- 사용자가 선택지를 바꾸면 기존 임시 답안을 갱신한다.
- 최종 제출 시 각 `Answer`의 `isCorrect`를 계산해 확정한다.
- 최종 제출이 완료된 세션의 `Answer`는 풀이 기록으로 유지하고 이후 수정을 막는다.

## 오답 복습 기준

오답 복습은 `DAILY_WRONG` 종류의 `QuestionSet`으로 제공한다. 생성 정책과 snapshot 기준은 [QuestionSet 기반 풀이 도메인 재설계](./04-solving-domain-redesign.md)를 따른다.

기준:

- 사용자 timezone 기준으로 하루에 사용자별 오답 문제지 1개를 만든다.
- 오늘의 오답 문제지는 `QuestionAttempt`를 기준으로 lazy generation한다.
- 기본 포함 대상은 최근 풀이 기준으로 `INCORRECT` 또는 `OMITTED` 상태인 문제다.
- 사용자가 오늘의 오답 문제지를 다시 풀어도, 같은 날의 오답 문제지 구성은 유지한다.
- 다음 날 갱신 시 다시 맞힌 문제는 오답 문제지에서 제외될 수 있다.

이후 개선안:

- 태그별 오답 복습 큐 제공
- N회 연속 정답 시 오답 졸업 처리
- 오답 문제지 문항 수 제한과 우선순위 정렬

## 프론트엔드 라우트

```txt
/login
/register
/guest
/papers
/library
/papers/:paperId/solve
/sessions/:sessionId/result
/analytics
/review/wrong
/admin/papers
/admin/papers/new
/admin/papers/:paperId/questions/new
/admin/questions/:questionId/edit
```

`/register`는 현재 사용자가 게스트 token을 가진 경우 `POST /api/auth/convert`를 호출하고, token이 없으면 `POST /api/auth/register`를 호출한다. `/guest`는 게스트 시작 후 바로 문제지 목록 또는 내 책장으로 이동한다.

## 환경 변수

### apps/api

```txt
DATABASE_URL="postgresql://{user}:{password}@{render-internal-host}:5432/{database}"
JWT_SECRET="local-dev-secret"
WEB_ORIGINS="http://localhost:3000,https://{vercel-domain}"
PORT=4000
NODE_ENV="production"

R2_ENDPOINT="https://{accountId}.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="kichulbot-question-images"
R2_PUBLIC_BASE_URL="https://{r2-public-domain}"
```

### apps/web

```txt
NEXT_PUBLIC_API_BASE_URL="https://{render-api-domain}/api"
```

## 초기 seed 데이터

MVP에서는 다음 데이터를 seed로 만든다.

- 관리자 사용자 1명
- 시험: 수능
- 과목: 한국사
- 시대 태그 7개

문제지와 20문항은 관리자 화면에서 직접 등록한다.

## 로컬 PostgreSQL

로컬 개발에서는 Docker Compose로 PostgreSQL을 실행한다.

예상 `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: kichulbot-postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: kichulbot
      POSTGRES_PASSWORD: kichulbot
      POSTGRES_DB: kichulbot
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

배포 환경에서는 Render Postgres를 사용하므로, Docker Compose DB는 로컬 개발 전용이다.

## 배포 절차

### 1. Render Postgres 생성

- Render Postgres 인스턴스를 만든다.
- API 서비스와 같은 리전에 둔다.
- internal database URL을 확인한다.
- Render에서 사용할 `DATABASE_URL`을 설정한다.
- Prisma migration을 배포 DB에 적용한다.

### 2. Cloudflare R2 버킷 생성

- `kichulbot-question-images` 버킷을 만든다.
- API token 또는 access key를 만든다.
- public read를 설정한다.
- Render 환경 변수에 R2 값을 등록한다.

### 3. Render API 서비스 생성

- `apps/api`를 NestJS API 서비스로 Docker 배포한다.
- `NODE_ENV=production`을 설정한다.
- `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGINS`, R2 환경 변수를 등록한다.
- Health check path를 `/api/health`로 둔다.
- 배포 전 또는 배포 단계에서 `prisma migrate deploy`가 실행되도록 한다.

### 4. Vercel Web 프로젝트 생성

- `apps/web`을 Next.js 프로젝트로 배포한다.
- `NEXT_PUBLIC_API_BASE_URL`에 Render API URL을 설정한다.
- Preview와 Production 환경 변수를 각각 설정한다.
- API CORS 허용 origin에 Vercel URL을 추가한다.

### 5. Seed 실행

배포 DB에 다음 seed 데이터를 넣는다.

- 관리자 사용자 1명
- 시험: 수능
- 과목: 한국사
- 시대 태그 7개

### 6. Smoke Test

배포 후 다음 흐름을 확인한다.

- 회원가입
- 로그인
- 관리자 문제지 생성
- 관리자 문제 이미지 업로드
- 내 책장 추가
- 20문항 풀이
- 답안 제출
- 결과 확인
- 태그별 약점 분석 확인
- 오답 복습

## 구현 순서

1. NestJS API 앱 생성
2. Next.js 웹 앱 생성
3. Docker Compose로 PostgreSQL 설정
4. Prisma와 PostgreSQL 연결 설정
5. R2 StorageService 구현
6. 인증 구현
7. 관리자 seed 계정 생성
8. 태그 seed 데이터 생성
9. 문제지 등록 API와 화면 구현
10. 문제 이미지 업로드 API와 화면 구현
11. 내 책장 API와 화면 구현
12. 문제지 풀이 화면 구현
13. 문항 선택 시 임시 답안 저장 구현
14. 답안 제출과 결과 저장 구현
15. 결과 화면 구현
16. 태그별 약점 분석 구현
17. 매일 갱신되는 오답 문제지 구현
18. 오답 복습 구현
19. Render Postgres 생성
20. Render API Docker 배포
21. Vercel Web 배포
22. 배포 환경 smoke test

## 테스트 범위

MVP에서는 다음 흐름을 우선 검증한다.

- 회원가입 후 로그인할 수 있다.
- 관리자가 문제지를 만들 수 있다.
- 관리자가 문제 이미지와 정답, 태그를 등록할 수 있다.
- 사용자가 문제지를 내 책장에 추가할 수 있다.
- 문항 선택 시 임시 답안이 저장된다.
- 사용자가 20문항 답안을 제출할 수 있다.
- 제출 결과가 정오답으로 저장된다.
- 태그별 정답률이 계산된다.
- 매일 갱신되는 오답 문제지를 다시 풀 수 있다.
- 배포 환경에서 관리자 이미지 업로드 후 Vercel 화면에서 이미지가 표시된다.
- Render API가 Render Postgres와 R2에 정상 연결된다.

## 열어둘 결정

- 전체 문제를 한 화면에서 푸는 보기 모드는 MVP 이후 어느 시점에 추가할지 결정해야 한다.
