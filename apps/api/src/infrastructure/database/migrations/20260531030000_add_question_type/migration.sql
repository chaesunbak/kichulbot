-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'WRITTEN');

-- AlterTable
ALTER TABLE "Question" RENAME COLUMN "answer" TO "answerChoice";
ALTER TABLE "Question"
ADD COLUMN "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
ADD COLUMN "answerText" TEXT,
ALTER COLUMN "choiceCount" DROP NOT NULL,
ALTER COLUMN "answerChoice" DROP NOT NULL;

-- AddConstraint
ALTER TABLE "Question"
ADD CONSTRAINT "Question_answer_by_type_check"
CHECK (
  (
    "type" = 'MULTIPLE_CHOICE'
    AND "choiceCount" IS NOT NULL
    AND "choiceCount" BETWEEN 2 AND 10
    AND "answerChoice" IS NOT NULL
    AND "answerChoice" BETWEEN 1 AND "choiceCount"
    AND "answerText" IS NULL
  )
  OR
  (
    "type" = 'WRITTEN'
    AND "choiceCount" IS NULL
    AND "answerChoice" IS NULL
    AND "answerText" IS NOT NULL
    AND LENGTH(BTRIM("answerText")) BETWEEN 1 AND 2000
  )
);
