ALTER TABLE "Question" ADD COLUMN "recommendedTagMatches" JSONB NOT NULL DEFAULT '[]'::jsonb;
