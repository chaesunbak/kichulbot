BEGIN;

ALTER TABLE "Tag"
  ADD COLUMN IF NOT EXISTS "examId" TEXT;

DO $$
BEGIN
  IF to_regclass('"TagExam"') IS NOT NULL THEN
    UPDATE "Tag" AS tag
    SET "examId" = tag_exam."examId"
    FROM (
      SELECT DISTINCT ON ("tagId")
        "tagId",
        "examId"
      FROM "TagExam"
      ORDER BY "tagId", "createdAt" ASC, "examId" ASC
    ) AS tag_exam
    WHERE
      tag."id" = tag_exam."tagId"
      AND tag."examId" IS NULL;
  END IF;
END $$;

UPDATE "Tag"
SET "examId" = (
  SELECT "id"
  FROM "Exam"
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
)
WHERE "examId" IS NULL;

ALTER TABLE "Tag"
  ALTER COLUMN "examId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Tag_examId_fkey'
  ) THEN
    ALTER TABLE "Tag"
      ADD CONSTRAINT "Tag_examId_fkey"
      FOREIGN KEY ("examId") REFERENCES "Exam"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Tag_examId_idx"
  ON "Tag"("examId");

DELETE FROM "QuestionTag" AS question_tag
USING "Question", "Paper", "ExamSession", "Tag"
WHERE
  question_tag."questionId" = "Question"."id"
  AND "Question"."paperId" = "Paper"."id"
  AND "Paper"."examSessionId" = "ExamSession"."id"
  AND question_tag."tagId" = "Tag"."id"
  AND "ExamSession"."examId" <> "Tag"."examId";

DROP TABLE IF EXISTS "TagExam";

COMMIT;
