ALTER TABLE "PaperImportJob"
ADD COLUMN "paperId" TEXT,
ADD COLUMN "paperInput" JSONB;

CREATE INDEX "PaperImportJob_paperId_idx" ON "PaperImportJob"("paperId");
