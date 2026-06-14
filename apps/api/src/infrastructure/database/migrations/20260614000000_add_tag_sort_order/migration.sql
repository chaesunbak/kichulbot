-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Tag_examId_tagGroupId_sortOrder_idx" ON "Tag"("examId", "tagGroupId", "sortOrder");
