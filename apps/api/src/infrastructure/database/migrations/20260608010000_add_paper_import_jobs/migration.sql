CREATE TYPE "PaperImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "PaperImportJob" (
  "id" TEXT NOT NULL,
  "status" "PaperImportJobStatus" NOT NULL DEFAULT 'PENDING',
  "questionPdfPath" TEXT NOT NULL,
  "questionPdfName" TEXT NOT NULL,
  "answerPdfPath" TEXT NOT NULL,
  "answerPdfName" TEXT NOT NULL,
  "resultJsonPath" TEXT,
  "errorMessage" TEXT,
  "inputOptions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),

  CONSTRAINT "PaperImportJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaperImportJob_status_createdAt_idx" ON "PaperImportJob"("status", "createdAt");
