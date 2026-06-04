ALTER TABLE "Question" ADD COLUMN "imageHash" TEXT;
ALTER TABLE "QuestionRevision" ADD COLUMN "imageHash" TEXT;

UPDATE "Question"
SET "imageHash" = 'legacy_' || md5("imageUrl");

UPDATE "QuestionRevision"
SET "imageHash" = 'legacy_' || md5("imageUrl");

ALTER TABLE "Question" ALTER COLUMN "imageHash" SET NOT NULL;
ALTER TABLE "QuestionRevision" ALTER COLUMN "imageHash" SET NOT NULL;
