-- CreateTable
CREATE TABLE "TagSubject" (
    "tagId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TagSubject_pkey" PRIMARY KEY ("tagId","subjectId")
);

-- AlterTable
ALTER TABLE "Tag"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "category";

-- DropEnum
DROP TYPE "TagCategory";

-- Preserve the current flat tag list for every existing subject.
INSERT INTO "TagSubject" ("tagId", "subjectId")
SELECT "Tag"."id", "Subject"."id"
FROM "Tag"
CROSS JOIN "Subject";

-- CreateIndex
CREATE INDEX "Tag_isActive_idx" ON "Tag"("isActive");

-- CreateIndex
CREATE INDEX "TagSubject_subjectId_idx" ON "TagSubject"("subjectId");

-- AddForeignKey
ALTER TABLE "TagSubject" ADD CONSTRAINT "TagSubject_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagSubject" ADD CONSTRAINT "TagSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
