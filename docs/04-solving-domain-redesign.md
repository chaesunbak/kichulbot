# QuestionSet 기반 풀이 도메인 재설계

## 목적

이 문서는 공식 문제지, 북마크 또는 커스텀 목록, 날짜별 오답, 취약유형 추천을 같은 풀이 엔진으로 처리하기 위한 목표 스키마와 단계별 이관 기준을 정의한다.

기존 MVP의 `BookmarkList`, `BookmarkedQuestion`, `Answer`/`DraftAnswer` 테이블은 `QuestionSet`, `DraftResponse`, `QuestionAttempt`로 이관한 뒤 제거한다. 아래 모델을 한 번에 교체하지 않고, 데이터 이관과 API 전환을 나누어 적용한다.

## 핵심 결정

- `Paper`는 공식 시험 출처 메타데이터만 담당한다.
- 실제 풀이 대상 묶음은 ordered collection인 `QuestionSet`, `QuestionSetItem`으로 표현한다.
- 공식 문제지도 `OFFICIAL_PAPER` 종류의 `QuestionSet` 하나를 참조한다.
- 북마크 목록과 사용자가 편집하는 문제 목록은 별도 모델 대신 `CUSTOM` 종류의 `QuestionSet`으로 표현한다.
- 세션 시작 시 `QuestionSetItem`을 `SolveSessionItem`으로 복제하여 풀이 대상을 고정한다.
- 풀이 중 변경 가능한 답안은 `DraftResponse`, 채점 완료 후 변경하지 않는 기록은 append-only `QuestionAttempt`로 분리한다.
- 미응답 문항도 채점 시 `OMITTED` outcome으로 기록한다.
- 문항 내용과 채점 기준은 불변 `QuestionRevision`으로 관리한다.
- 날짜별 세트의 `studyDate`는 서버 timezone이 아니라 `User.timezone` 기준으로 계산한다.
- 추천 또는 날짜별 세트는 생성 근거를 보존한다.

## 모델 책임

### Paper

공식 시험 출처 메타데이터다. 예: 2026학년도 수능 한국사.

`Paper`는 `OFFICIAL_PAPER` 종류의 `QuestionSet` 하나를 참조한다. 별도 `PaperItem`은 만들지 않는다.

### Question과 QuestionRevision

`Question`은 태그와 분석을 연결하는 논리 문항의 안정적인 식별자다.

`QuestionRevision`은 이미지, 선택지 수, 정답, 해설처럼 채점 기준에 영향을 주는 불변 버전이다. 문항 내용 또는 채점 기준을 수정할 때 기존 revision을 update하지 않고 새 revision을 추가한다.

운영 중인 세트가 최신 revision을 노출해야 하면 해당 `QuestionSetItem.questionRevisionId`를 갱신한다. 이미 시작한 세션과 과거 attempt는 기존 revision을 계속 참조한다.

### QuestionSet과 QuestionSetItem

`QuestionSet`은 실제로 풀 수 있는 ordered question collection이다.

`QuestionSetKind`:

- `OFFICIAL_PAPER`: 공식 문제지
- `CUSTOM`: 북마크 또는 사용자가 편집하는 커스텀 목록
- `DAILY_WRONG`: 날짜별 오답 복습 세트
- `DAILY_WEAKNESS`: 날짜별 취약유형 세트
- `RECOMMENDED`: 개인화 추천 세트

`QuestionSetItem.position`이 세트 안의 문항 순서를 결정한다. 생성된 세트의 각 항목에는 필요하면 `sourceAttemptId`와 `reason`을 저장한다.

### GeneratedQuestionSet

lazy generation으로 만든 날짜별 또는 추천 세트의 생성 메타데이터다.

- `generatorVersion`: 생성 로직 버전
- `parameters`: 생성에 사용한 옵션과 기준
- `studyDate`: 사용자 timezone 기준 학습 날짜
- `expiresAt`: 필요할 때만 사용하는 만료 시점

`GeneratedQuestionSet.kind`는 `QuestionSet.kind`와 같아야 한다. 이 invariant는 생성 서비스에서 검증한다.

### SolveSession과 SolveSessionItem

`SolveSession`은 사용자의 한 번의 풀이 시도다.

원본 `QuestionSet`은 풀이 중에도 수정될 수 있으므로 세션 시작 transaction에서 현재 항목을 `SolveSessionItem`으로 복제한다. 이후 조회, 임시 저장, 제출, 결과 화면은 원본 세트가 아니라 session item snapshot을 기준으로 동작한다.

### DraftResponse와 QuestionAttempt

`DraftResponse`는 풀이 중 선택 답안과 누적 풀이 시간을 저장한다. 새로고침 복원을 위해 update와 upsert를 허용한다.

`QuestionAttempt`는 채점 시점에 insert하는 append-only 학습 이력이다. 정답 수정이나 문항 revision 변경이 발생해도 과거 풀이 결과는 당시 revision 기준으로 재현할 수 있다.

채점 정책:

- 시험 모드: 최종 제출 시 모든 session item에 대해 attempt를 추가한다.
- 즉시 확인 모드: 사용자가 정답을 확인할 때마다 attempt를 추가한다. 같은 문항을 다시 시도하면 attempt도 추가된다.
- 즉시 확인 모드 최종 제출: 아직 채점 이력이 없는 session item만 `OMITTED` attempt를 추가한다.
- 미응답 문항: `OMITTED`로 기록하고 날짜별 오답 세트 후보에 포함한다.

## Prisma Schema 기준안

아래 스키마는 단계별 migration의 목표 형태다. 실제 반영 시 기존 이름과 데이터 이관 순서에 맞춰 migration을 나눈다.

```prisma
enum QuestionType {
  MULTIPLE_CHOICE
  WRITTEN
}

enum AnswerMode {
  ONE_BY_ONE
  EXAM
}

enum QuestionSetKind {
  OFFICIAL_PAPER
  CUSTOM
  DAILY_WRONG
  DAILY_WEAKNESS
  RECOMMENDED
}

enum AttemptOutcome {
  CORRECT
  INCORRECT
  OMITTED
}

model User {
  id       String @id @default(cuid())
  timezone String @default("Asia/Seoul")

  ownedQuestionSets     QuestionSet[]
  generatedQuestionSets GeneratedQuestionSet[]
  solveSessions         SolveSession[]
  questionAttempts      QuestionAttempt[]
}

model Paper {
  id            String @id @default(cuid())
  questionSetId String @unique

  questionSet QuestionSet @relation(fields: [questionSetId], references: [id])
  // 공식 시험 출처 메타데이터
}

model Question {
  id String @id @default(cuid())

  revisions QuestionRevision[]
  tags      QuestionTag[]
}

model Tag {
  id String @id @default(cuid())

  questions QuestionTag[]
}

model QuestionTag {
  questionId String
  tagId      String

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  tag      Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([questionId, tagId])
  @@index([tagId])
}

model QuestionRevision {
  id                     String       @id @default(cuid())
  questionId             String
  revision               Int
  type                   QuestionType @default(MULTIPLE_CHOICE)
  imageUrl               String?
  choiceCount            Int?
  answerChoice           Int?
  answerText             String?
  explanation            String?
  recommendedTimeSeconds Int?

  question        Question          @relation(fields: [questionId], references: [id])
  questionSetItems QuestionSetItem[]
  sessionItems     SolveSessionItem[]
  attempts         QuestionAttempt[]

  @@unique([questionId, revision])
  @@index([questionId])
}

model QuestionSet {
  id          String          @id @default(cuid())
  kind        QuestionSetKind
  ownerUserId String?
  title       String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  owner          User?                 @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)
  items          QuestionSetItem[]
  generated      GeneratedQuestionSet?
  officialPaper  Paper?
  sourceSessions SolveSession[]

  @@index([ownerUserId, kind])
}

model QuestionSetItem {
  questionSetId      String
  questionRevisionId String
  position           Int
  sourceAttemptId    String?
  reason             Json?

  questionSet      QuestionSet      @relation(fields: [questionSetId], references: [id], onDelete: Cascade)
  questionRevision QuestionRevision @relation(fields: [questionRevisionId], references: [id])
  sourceAttempt    QuestionAttempt? @relation(fields: [sourceAttemptId], references: [id])

  @@id([questionSetId, questionRevisionId])
  @@unique([questionSetId, position])
  @@index([questionRevisionId])
  @@index([sourceAttemptId])
}

model GeneratedQuestionSet {
  questionSetId    String          @id
  ownerUserId      String
  kind             QuestionSetKind
  studyDate        DateTime?       @db.Date
  generatorVersion String
  parameters       Json?
  generatedAt      DateTime        @default(now())
  expiresAt        DateTime?

  questionSet QuestionSet @relation(fields: [questionSetId], references: [id], onDelete: Cascade)
  owner       User        @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)

  @@unique([ownerUserId, kind, studyDate])
  @@index([ownerUserId, generatedAt])
}

model SolveSession {
  id          String     @id @default(cuid())
  userId      String
  sourceSetId String?
  mode        AnswerMode @default(EXAM)
  submittedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceSet QuestionSet?       @relation(fields: [sourceSetId], references: [id])
  items     SolveSessionItem[]

  @@index([userId, submittedAt])
  @@index([sourceSetId])
}

model SolveSessionItem {
  id                 String @id @default(cuid())
  sessionId          String
  questionRevisionId String
  position           Int

  session          SolveSession     @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  questionRevision QuestionRevision @relation(fields: [questionRevisionId], references: [id])
  draft            DraftResponse?
  attempts         QuestionAttempt[]

  @@unique([sessionId, questionRevisionId])
  @@unique([sessionId, position])
  @@index([questionRevisionId])
}

model DraftResponse {
  sessionItemId      String   @id
  answerChoice       Int?
  answerText         String?
  spentMilliseconds Int      @default(0)
  updatedAt          DateTime @updatedAt

  sessionItem SolveSessionItem @relation(fields: [sessionItemId], references: [id], onDelete: Cascade)
}

model QuestionAttempt {
  id                 String         @id @default(cuid())
  userId             String
  sessionItemId      String?
  questionRevisionId String
  answerChoice       Int?
  answerText         String?
  outcome            AttemptOutcome
  spentMilliseconds  Int            @default(0)
  gradedAt           DateTime       @default(now())

  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionItem      SolveSessionItem?  @relation(fields: [sessionItemId], references: [id])
  questionRevision QuestionRevision   @relation(fields: [questionRevisionId], references: [id])
  sourceSetItems   QuestionSetItem[]

  @@index([userId, questionRevisionId, gradedAt])
  @@index([userId, gradedAt])
  @@index([sessionItemId])
}
```

## 날짜별 세트 생성 정책

날짜별 세트는 사용자가 화면을 처음 열 때 lazy generation한다.

1. 사용자의 `timezone`으로 현재 `studyDate`를 계산한다.
2. `(ownerUserId, kind, studyDate)` unique key로 기존 세트를 조회한다.
3. 세트가 없으면 transaction 안에서 `QuestionSet`, `GeneratedQuestionSet`, `QuestionSetItem`을 생성한다.
4. 동시 요청으로 unique 충돌이 발생하면 이미 생성된 세트를 다시 조회해 반환한다.

사용자에게 노출한 뒤 구성이 유지되어야 하거나 추천 품질 추적이 필요한 목록은 DB snapshot으로 저장한다.

- 오늘의 오답 세트
- 오늘의 취약유형 세트
- 개인화 추천 세트
- 북마크 또는 사용자 커스텀 세트

단순 검색 결과나 필터 화면처럼 매 조회 시 바뀌어도 되는 목록은 DB에 저장하지 않는다.

## 단계별 이관 순서

1. `User.timezone`, `QuestionRevision`을 추가하고 기존 `Question` 내용을 revision 1로 복제한다.
2. `QuestionSet`, `QuestionSetItem`을 추가한다.
3. 기존 공식 `Paper`마다 `OFFICIAL_PAPER` set을 만들고 기존 `Question.number`를 `position`으로 이관한다.
4. `Paper.questionSetId`를 연결하고 공식 문제지 조회를 set item 기준으로 전환한다.
5. 기존 `BookmarkList`, `BookmarkedQuestion`을 `CUSTOM` set과 item으로 이관하고 북마크 API를 전환한다.
6. `SolveSession`, `SolveSessionItem`을 추가하고 기존 `AnswerSession`마다 풀이 대상 snapshot을 생성한다.
7. 기존 미제출 `Answer`를 `DraftResponse`로 이관한다.
8. 기존 제출 완료 `Answer`를 `QuestionAttempt`로 이관한다. 기존 데이터만으로 미응답 여부를 복원할 수 있으면 `OMITTED`도 추가한다.
9. 풀이 조회, 임시 저장, 제출 API를 snapshot과 attempt 기준으로 전환한다.
10. 기존 모델과 호환 코드를 제거한다.
11. 제출 기록별 오답 다시 풀기와 날짜별 `DAILY_WRONG` lazy generation을 구현한다.

각 단계는 데이터 backfill, dual read 또는 dual write가 필요한지 migration 구현 시 결정한다. 운영 데이터가 생긴 뒤에는 destructive schema 변경과 backfill을 같은 배포에 묶지 않는다.

## 불변 조건

- `Paper.questionSetId`가 가리키는 세트의 kind는 `OFFICIAL_PAPER`다.
- `GeneratedQuestionSet.kind`는 연결된 `QuestionSet.kind`와 같다.
- `DAILY_WRONG`, `DAILY_WEAKNESS` 세트의 `GeneratedQuestionSet.studyDate`는 null이 아니다.
- `QuestionRevision`은 생성 후 수정하지 않는다.
- 세션 생성과 `SolveSessionItem` 복제는 같은 transaction에서 처리한다.
- 제출된 `QuestionAttempt`는 update하거나 delete하지 않는다.
- 모든 시험 모드 session item은 제출 후 정확히 하나의 attempt를 가진다.
- `INCORRECT`, `OMITTED` attempt는 날짜별 오답 세트 후보에 포함된다.
- `QuestionSetItem.position`, `SolveSessionItem.position`은 각 부모 안에서 유일하다.

## 보류 항목

- `UserQuestionProgress`: 최신 상태, 시도 횟수, 연속 정답 수 조회가 느려질 때 `QuestionAttempt` 기반 projection으로 추가한다.
- 자정 batch 생성: 푸시 알림이나 생성 비용 문제로 필요해질 때 활성 사용자 prewarm을 추가한다. lazy generation은 fallback으로 유지한다.
- 동일 revision의 세트 내 중복 배치: 현재는 허용하지 않는다. 필요해지면 `QuestionSetItem`에 surrogate id를 도입한다.
- revision 교체 UI와 운영 승인 흐름: 관리자 문항 수정 기능을 revision 생성 방식으로 전환할 때 별도 정의한다.
