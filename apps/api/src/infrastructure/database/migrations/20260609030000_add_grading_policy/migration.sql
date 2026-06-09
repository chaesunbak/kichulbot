-- CreateEnum
CREATE TYPE "GradingPolicy" AS ENUM ('EXACT', 'ANY_CHOICE');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "gradingPolicy" "GradingPolicy" NOT NULL DEFAULT 'EXACT';

-- AlterTable
ALTER TABLE "QuestionRevision" ADD COLUMN "gradingPolicy" "GradingPolicy" NOT NULL DEFAULT 'EXACT';
