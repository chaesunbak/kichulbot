DO $$
BEGIN
  CREATE TYPE "QuestionReportCategory" AS ENUM (
    'QUESTION_ERROR',
    'IMAGE_ERROR',
    'CHOICE_ERROR',
    'ANSWER_ERROR',
    'EXPLANATION_ERROR',
    'CATEGORY_ERROR',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "QuestionReportStatus" AS ENUM (
    'PENDING',
    'IN_REVIEW',
    'RESOLVED',
    'DISMISSED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "QuestionReport" (
  "id" TEXT NOT NULL,
  "reporterUserId" TEXT,
  "questionId" TEXT NOT NULL,
  "questionRevisionId" TEXT,
  "category" "QuestionReportCategory" NOT NULL,
  "content" TEXT NOT NULL,
  "status" "QuestionReportStatus" NOT NULL DEFAULT 'PENDING',
  "adminMemo" TEXT,
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "QuestionReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionReport_status_createdAt_idx" ON "QuestionReport"("status", "createdAt");
CREATE INDEX "QuestionReport_category_idx" ON "QuestionReport"("category");
CREATE INDEX "QuestionReport_questionId_status_idx" ON "QuestionReport"("questionId", "status");
CREATE INDEX "QuestionReport_questionRevisionId_idx" ON "QuestionReport"("questionRevisionId");
CREATE INDEX "QuestionReport_reporterUserId_createdAt_idx" ON "QuestionReport"("reporterUserId", "createdAt");
CREATE INDEX "QuestionReport_reviewedByUserId_idx" ON "QuestionReport"("reviewedByUserId");

ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_reporterUserId_fkey"
  FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_questionRevisionId_fkey"
  FOREIGN KEY ("questionRevisionId") REFERENCES "QuestionRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
