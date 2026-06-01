BEGIN;

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Category" ("id", "name", "createdAt", "updatedAt")
VALUES (
  'seed-uncategorized',
  '미분류',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "Exam"
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

UPDATE "Exam"
SET "categoryId" = 'seed-uncategorized'
WHERE "categoryId" IS NULL;

ALTER TABLE "Exam"
  ALTER COLUMN "categoryId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Exam_categoryId_fkey'
  ) THEN
    ALTER TABLE "Exam"
      ADD CONSTRAINT "Exam_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Exam_categoryId_idx"
  ON "Exam"("categoryId");

CREATE TABLE IF NOT EXISTS "TagExam" (
  "tagId" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TagExam_pkey" PRIMARY KEY ("tagId", "examId"),
  CONSTRAINT "TagExam_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TagExam_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TagExam_examId_idx"
  ON "TagExam"("examId");

DROP TABLE IF EXISTS "TagSubject";

DROP INDEX IF EXISTS "Paper_subjectId_idx";
ALTER TABLE "Paper" DROP CONSTRAINT IF EXISTS "Paper_subjectId_fkey";
ALTER TABLE "Paper" DROP COLUMN IF EXISTS "subjectId";

DROP TABLE IF EXISTS "Subject";

COMMIT;
