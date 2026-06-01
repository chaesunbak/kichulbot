BEGIN;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul';

DO $$
BEGIN
  CREATE TYPE "QuestionSetKind" AS ENUM (
    'OFFICIAL_PAPER',
    'CUSTOM',
    'DAILY_WRONG',
    'DAILY_WEAKNESS',
    'RECOMMENDED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "QuestionSet" (
  "id" TEXT NOT NULL,
  "kind" "QuestionSetKind" NOT NULL,
  "ownerUserId" TEXT,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionSet_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuestionSet_ownerUserId_kind_idx"
  ON "QuestionSet"("ownerUserId", "kind");

ALTER TABLE "Paper"
  ADD COLUMN IF NOT EXISTS "questionSetId" TEXT;

INSERT INTO "QuestionSet" (
  "id",
  "kind",
  "title",
  "createdAt",
  "updatedAt"
)
SELECT
  'official-paper-' || md5("id"),
  'OFFICIAL_PAPER'::"QuestionSetKind",
  "title",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Paper"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuestionSet" (
  "id",
  "kind",
  "ownerUserId",
  "title",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  'CUSTOM'::"QuestionSetKind",
  "userId",
  "name",
  "createdAt",
  "updatedAt"
FROM "BookmarkList"
ON CONFLICT ("id") DO NOTHING;

UPDATE "Paper"
SET "questionSetId" = 'official-paper-' || md5("id")
WHERE "questionSetId" IS NULL;

ALTER TABLE "Paper"
  ALTER COLUMN "questionSetId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Paper_questionSetId_fkey'
  ) THEN
    ALTER TABLE "Paper"
      ADD CONSTRAINT "Paper_questionSetId_fkey"
      FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Paper_questionSetId_key"
  ON "Paper"("questionSetId");

CREATE TABLE IF NOT EXISTS "QuestionRevision" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
  "imageUrl" TEXT,
  "choiceCount" INTEGER,
  "answerChoice" INTEGER,
  "answerText" TEXT,
  "explanation" TEXT,
  "recommendedTimeSeconds" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionRevision_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuestionRevision_questionId_revision_key"
  ON "QuestionRevision"("questionId", "revision");
CREATE INDEX IF NOT EXISTS "QuestionRevision_questionId_idx"
  ON "QuestionRevision"("questionId");

INSERT INTO "QuestionRevision" (
  "id",
  "questionId",
  "revision",
  "type",
  "imageUrl",
  "choiceCount",
  "answerChoice",
  "answerText",
  "explanation",
  "recommendedTimeSeconds",
  "createdAt"
)
SELECT
  'question-revision-' || md5("id" || ':1'),
  "id",
  1,
  "type",
  "imageUrl",
  "choiceCount",
  "answerChoice",
  "answerText",
  "explanation",
  "recommendedTimeSeconds",
  CURRENT_TIMESTAMP
FROM "Question"
ON CONFLICT ("questionId", "revision") DO NOTHING;

CREATE TABLE IF NOT EXISTS "QuestionSetItem" (
  "questionSetId" TEXT NOT NULL,
  "questionRevisionId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "reason" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionSetItem_pkey"
    PRIMARY KEY ("questionSetId", "questionRevisionId"),
  CONSTRAINT "QuestionSetItem_questionSetId_fkey"
    FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QuestionSetItem_questionRevisionId_fkey"
    FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuestionSetItem_questionSetId_position_key"
  ON "QuestionSetItem"("questionSetId", "position");
CREATE INDEX IF NOT EXISTS "QuestionSetItem_questionRevisionId_idx"
  ON "QuestionSetItem"("questionRevisionId");

INSERT INTO "QuestionSetItem" (
  "questionSetId",
  "questionRevisionId",
  "position",
  "createdAt"
)
SELECT
  paper."questionSetId",
  revision."id",
  question."number",
  CURRENT_TIMESTAMP
FROM "Question" AS question
JOIN "Paper" AS paper ON paper."id" = question."paperId"
JOIN "QuestionRevision" AS revision
  ON revision."questionId" = question."id" AND revision."revision" = 1
ON CONFLICT ("questionSetId", "questionRevisionId") DO NOTHING;

INSERT INTO "QuestionSetItem" (
  "questionSetId",
  "questionRevisionId",
  "position",
  "createdAt"
)
SELECT
  bookmarked."bookmarkListId",
  revision."id",
  ROW_NUMBER() OVER (
    PARTITION BY bookmarked."bookmarkListId"
    ORDER BY bookmarked."createdAt", bookmarked."questionId"
  )::INTEGER,
  bookmarked."createdAt"
FROM "BookmarkedQuestion" AS bookmarked
JOIN LATERAL (
  SELECT "id"
  FROM "QuestionRevision"
  WHERE "questionId" = bookmarked."questionId"
  ORDER BY "revision" DESC
  LIMIT 1
) AS revision ON true
ON CONFLICT ("questionSetId", "questionRevisionId") DO NOTHING;

CREATE TABLE IF NOT EXISTS "GeneratedQuestionSet" (
  "questionSetId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "kind" "QuestionSetKind" NOT NULL,
  "studyDate" DATE,
  "generatorVersion" TEXT NOT NULL,
  "parameters" JSONB,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "GeneratedQuestionSet_pkey" PRIMARY KEY ("questionSetId"),
  CONSTRAINT "GeneratedQuestionSet_questionSetId_fkey"
    FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GeneratedQuestionSet_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "GeneratedQuestionSet_ownerUserId_kind_studyDate_key"
  ON "GeneratedQuestionSet"("ownerUserId", "kind", "studyDate");
CREATE INDEX IF NOT EXISTS "GeneratedQuestionSet_ownerUserId_generatedAt_idx"
  ON "GeneratedQuestionSet"("ownerUserId", "generatedAt");

COMMIT;
