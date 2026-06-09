ALTER TABLE "Question"
ADD COLUMN "rawText" TEXT,
ADD COLUMN "promptText" TEXT,
ADD COLUMN "passageText" TEXT,
ADD COLUMN "choiceTexts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "QuestionRevision"
ADD COLUMN "rawText" TEXT,
ADD COLUMN "promptText" TEXT,
ADD COLUMN "passageText" TEXT,
ADD COLUMN "choiceTexts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
