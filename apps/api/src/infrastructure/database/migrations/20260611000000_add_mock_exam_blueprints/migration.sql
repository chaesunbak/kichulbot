-- AlterTable
ALTER TABLE "Exam"
ADD COLUMN "mockExamQuestionCount" INTEGER,
ADD COLUMN "eraTagGroupId" TEXT;

-- CreateTable
CREATE TABLE "MockExamBlueprintItem" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "minQuestionCount" INTEGER NOT NULL DEFAULT 0,
    "maxQuestionCount" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockExamBlueprintItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exam_eraTagGroupId_idx" ON "Exam"("eraTagGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "MockExamBlueprintItem_examId_tagId_key" ON "MockExamBlueprintItem"("examId", "tagId");

-- CreateIndex
CREATE INDEX "MockExamBlueprintItem_tagId_idx" ON "MockExamBlueprintItem"("tagId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_eraTagGroupId_fkey" FOREIGN KEY ("eraTagGroupId") REFERENCES "TagGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamBlueprintItem" ADD CONSTRAINT "MockExamBlueprintItem_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamBlueprintItem" ADD CONSTRAINT "MockExamBlueprintItem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
