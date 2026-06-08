ALTER TABLE "Exam" ADD COLUMN "slug" TEXT;

UPDATE "Exam" SET "slug" = "id" WHERE "slug" IS NULL;

ALTER TABLE "Exam" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Exam_slug_key" ON "Exam"("slug");
