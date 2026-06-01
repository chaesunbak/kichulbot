BEGIN;

DO $$
BEGIN
  CREATE TYPE "AttemptOutcome" AS ENUM (
    'CORRECT',
    'INCORRECT',
    'OMITTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "DraftResponse" (
  "sessionItemId" TEXT NOT NULL,
  "answerChoice" INTEGER,
  "answerText" TEXT,
  "spentMilliseconds" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DraftResponse_pkey" PRIMARY KEY ("sessionItemId"),
  CONSTRAINT "DraftResponse_sessionItemId_fkey"
    FOREIGN KEY ("sessionItemId") REFERENCES "SolveSessionItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "DraftResponse" (
  "sessionItemId",
  "answerChoice",
  "answerText",
  "spentMilliseconds",
  "updatedAt"
)
SELECT
  item."id",
  answer."answerChoice",
  answer."answerText",
  answer."spentMilliseconds",
  answer."updatedAt"
FROM "DraftAnswer" AS answer
JOIN "SolveSessionItem" AS item ON item."sessionId" = answer."sessionId"
JOIN "QuestionRevision" AS revision
  ON revision."id" = item."questionRevisionId"
  AND revision."questionId" = answer."questionId"
ON CONFLICT ("sessionItemId") DO NOTHING;

CREATE TABLE IF NOT EXISTS "QuestionAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionItemId" TEXT,
  "questionRevisionId" TEXT NOT NULL,
  "answerChoice" INTEGER,
  "answerText" TEXT,
  "outcome" "AttemptOutcome" NOT NULL,
  "spentMilliseconds" INTEGER NOT NULL DEFAULT 0,
  "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QuestionAttempt_sessionItemId_fkey"
    FOREIGN KEY ("sessionItemId") REFERENCES "SolveSessionItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "QuestionAttempt_questionRevisionId_fkey"
    FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuestionAttempt_userId_questionRevisionId_gradedAt_idx"
  ON "QuestionAttempt"("userId", "questionRevisionId", "gradedAt");
CREATE INDEX IF NOT EXISTS "QuestionAttempt_userId_gradedAt_idx"
  ON "QuestionAttempt"("userId", "gradedAt");
CREATE INDEX IF NOT EXISTS "QuestionAttempt_sessionItemId_idx"
  ON "QuestionAttempt"("sessionItemId");

INSERT INTO "QuestionAttempt" (
  "id",
  "userId",
  "sessionItemId",
  "questionRevisionId",
  "answerChoice",
  "answerText",
  "outcome",
  "spentMilliseconds",
  "gradedAt"
)
SELECT
  'question-attempt-' || md5(item."id" || ':submitted'),
  session."userId",
  item."id",
  item."questionRevisionId",
  answer."answerChoice",
  answer."answerText",
  CASE
    WHEN answer."answerChoice" IS NULL AND answer."answerText" IS NULL
      THEN 'OMITTED'::"AttemptOutcome"
    WHEN revision."type" = 'MULTIPLE_CHOICE'
      AND answer."answerChoice" = revision."answerChoice"
      THEN 'CORRECT'::"AttemptOutcome"
    WHEN revision."type" = 'WRITTEN'
      AND BTRIM(answer."answerText") = BTRIM(revision."answerText")
      THEN 'CORRECT'::"AttemptOutcome"
    ELSE 'INCORRECT'::"AttemptOutcome"
  END,
  COALESCE(answer."spentMilliseconds", 0),
  session."submittedAt"
FROM "AnswerSession" AS session
JOIN "SolveSessionItem" AS item ON item."sessionId" = session."id"
JOIN "QuestionRevision" AS revision ON revision."id" = item."questionRevisionId"
LEFT JOIN "DraftAnswer" AS answer
  ON answer."sessionId" = session."id"
  AND answer."questionId" = revision."questionId"
WHERE session."submittedAt" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "QuestionSetItem"
  ADD COLUMN IF NOT EXISTS "sourceAttemptId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'QuestionSetItem_sourceAttemptId_fkey'
  ) THEN
    ALTER TABLE "QuestionSetItem"
      ADD CONSTRAINT "QuestionSetItem_sourceAttemptId_fkey"
      FOREIGN KEY ("sourceAttemptId") REFERENCES "QuestionAttempt"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "QuestionSetItem_sourceAttemptId_idx"
  ON "QuestionSetItem"("sourceAttemptId");

COMMIT;
