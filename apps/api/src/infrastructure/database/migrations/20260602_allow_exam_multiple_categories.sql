BEGIN;

CREATE TABLE IF NOT EXISTS "ExamCategory" (
  "examId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamCategory_pkey" PRIMARY KEY ("examId", "categoryId"),
  CONSTRAINT "ExamCategory_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExamCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ExamCategory_categoryId_idx"
  ON "ExamCategory"("categoryId");

INSERT INTO "ExamCategory" ("examId", "categoryId", "createdAt")
SELECT "id", "categoryId", CURRENT_TIMESTAMP
FROM "Exam"
WHERE "categoryId" IS NOT NULL
ON CONFLICT ("examId", "categoryId") DO NOTHING;

DROP INDEX IF EXISTS "Exam_categoryId_idx";
ALTER TABLE "Exam" DROP CONSTRAINT IF EXISTS "Exam_categoryId_fkey";
ALTER TABLE "Exam" DROP COLUMN IF EXISTS "categoryId";

COMMIT;
