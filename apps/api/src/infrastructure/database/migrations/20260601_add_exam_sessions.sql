BEGIN;

ALTER TABLE "Exam"
  ADD COLUMN IF NOT EXISTS "usesMonth" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "usesGrade" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "usesRound" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Exam"
SET
  "name" = '수능',
  "usesMonth" = false,
  "usesGrade" = false,
  "usesRound" = false
WHERE "name" = '수능';

INSERT INTO "Exam" (
  "id",
  "name",
  "usesMonth",
  "usesGrade",
  "usesRound",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'seed-mock-exam',
    '전국연합학력평가',
    true,
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-korean-history-proficiency-test',
    '한국사능력검정시험',
    false,
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "usesMonth" = EXCLUDED."usesMonth",
  "usesGrade" = EXCLUDED."usesGrade",
  "usesRound" = EXCLUDED."usesRound";

CREATE TABLE IF NOT EXISTS "ExamSession" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "displayYear" INTEGER NOT NULL,
  "month" INTEGER,
  "grade" INTEGER,
  "round" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExamSession_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExamSession_key_key"
  ON "ExamSession"("key");
CREATE INDEX IF NOT EXISTS "ExamSession_examId_displayYear_month_grade_round_idx"
  ON "ExamSession"("examId", "displayYear", "month", "grade", "round");

ALTER TABLE "Paper"
  ADD COLUMN IF NOT EXISTS "examSessionId" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Paper' AND column_name = 'examId'
  ) THEN
    INSERT INTO "ExamSession" (
      "id",
      "key",
      "examId",
      "displayYear",
      "month",
      "grade",
      "round",
      "createdAt",
      "updatedAt"
    )
    SELECT DISTINCT
      'legacy-' || md5("examId" || ':' || "year" || ':-:-:-'),
      "examId" || ':' || "year" || ':-:-:-',
      "examId",
      "year",
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::INTEGER,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM "Paper"
    ON CONFLICT ("key") DO NOTHING;

    UPDATE "Paper" AS paper
    SET "examSessionId" = session."id"
    FROM "ExamSession" AS session
    WHERE
      paper."examSessionId" IS NULL
      AND session."key" = paper."examId" || ':' || paper."year" || ':-:-:-';
  END IF;
END $$;

ALTER TABLE "Paper"
  ALTER COLUMN "examSessionId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Paper_examSessionId_fkey'
  ) THEN
    ALTER TABLE "Paper"
      ADD CONSTRAINT "Paper_examSessionId_fkey"
      FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Paper_examSessionId_idx"
  ON "Paper"("examSessionId");

DROP INDEX IF EXISTS "Paper_examId_idx";
ALTER TABLE "Paper" DROP CONSTRAINT IF EXISTS "Paper_examId_fkey";
ALTER TABLE "Paper" DROP COLUMN IF EXISTS "examId";
ALTER TABLE "Paper" DROP COLUMN IF EXISTS "year";

COMMIT;
