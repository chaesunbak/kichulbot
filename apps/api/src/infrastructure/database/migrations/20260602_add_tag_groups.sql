BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TagSelectionMode'
  ) THEN
    CREATE TYPE "TagSelectionMode" AS ENUM ('SINGLE', 'MULTIPLE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "TagGroup" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "selectionMode" "TagSelectionMode" NOT NULL DEFAULT 'MULTIPLE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TagGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TagGroup_examId_fkey"
    FOREIGN KEY ("examId") REFERENCES "Exam"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TagGroup_examId_isActive_sortOrder_idx"
  ON "TagGroup"("examId", "isActive", "sortOrder");

ALTER TABLE "Tag"
  ADD COLUMN IF NOT EXISTS "tagGroupId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Tag_tagGroupId_fkey'
  ) THEN
    ALTER TABLE "Tag"
      ADD CONSTRAINT "Tag_tagGroupId_fkey"
      FOREIGN KEY ("tagGroupId") REFERENCES "TagGroup"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Tag_tagGroupId_idx"
  ON "Tag"("tagGroupId");

INSERT INTO "TagGroup" (
  "id",
  "examId",
  "name",
  "selectionMode",
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    'seed-korean-history-proficiency-test-period',
    'seed-korean-history-proficiency-test',
    '시대',
    'SINGLE',
    10,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'seed-korean-history-proficiency-test-domain',
    'seed-korean-history-proficiency-test',
    '영역',
    'MULTIPLE',
    20,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET
  "examId" = EXCLUDED."examId",
  "name" = EXCLUDED."name",
  "selectionMode" = EXCLUDED."selectionMode",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Tag"
SET "tagGroupId" = 'seed-korean-history-proficiency-test-period'
WHERE
  "examId" = 'seed-korean-history-proficiency-test'
  AND "name" IN (
    '선사',
    '고대',
    '고려',
    '조선',
    '개항기',
    '일제강점기',
    '현대'
  );

UPDATE "Tag"
SET "tagGroupId" = 'seed-korean-history-proficiency-test-domain'
WHERE
  "examId" = 'seed-korean-history-proficiency-test'
  AND "name" IN (
    '정치',
    '경제',
    '사회',
    '문화'
  );

COMMIT;
