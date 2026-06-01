BEGIN;

ALTER TABLE "AnswerSession"
  ADD COLUMN IF NOT EXISTS "sourceSetId" TEXT;

UPDATE "AnswerSession" AS session
SET "sourceSetId" = paper."questionSetId"
FROM "Paper" AS paper
WHERE session."paperId" = paper."id" AND session."sourceSetId" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AnswerSession_sourceSetId_fkey'
  ) THEN
    ALTER TABLE "AnswerSession"
      ADD CONSTRAINT "AnswerSession_sourceSetId_fkey"
      FOREIGN KEY ("sourceSetId") REFERENCES "QuestionSet"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AnswerSession_sourceSetId_idx"
  ON "AnswerSession"("sourceSetId");

CREATE TABLE IF NOT EXISTS "SolveSessionItem" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "questionRevisionId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SolveSessionItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SolveSessionItem_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "AnswerSession"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolveSessionItem_questionRevisionId_fkey"
    FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SolveSessionItem_sessionId_questionRevisionId_key"
  ON "SolveSessionItem"("sessionId", "questionRevisionId");
CREATE UNIQUE INDEX IF NOT EXISTS "SolveSessionItem_sessionId_position_key"
  ON "SolveSessionItem"("sessionId", "position");
CREATE INDEX IF NOT EXISTS "SolveSessionItem_questionRevisionId_idx"
  ON "SolveSessionItem"("questionRevisionId");

INSERT INTO "SolveSessionItem" (
  "id",
  "sessionId",
  "questionRevisionId",
  "position",
  "createdAt"
)
SELECT
  'solve-session-item-' || md5(session."id" || ':' || item."questionRevisionId"),
  session."id",
  item."questionRevisionId",
  item."position",
  session."createdAt"
FROM "AnswerSession" AS session
JOIN "QuestionSetItem" AS item ON item."questionSetId" = session."sourceSetId"
ON CONFLICT ("sessionId", "questionRevisionId") DO NOTHING;

COMMIT;
