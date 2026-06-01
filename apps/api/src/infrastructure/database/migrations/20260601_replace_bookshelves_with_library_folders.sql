CREATE TABLE "LibraryFolder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "parentId" TEXT,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LibraryFolder_pkey" PRIMARY KEY ("id")
);

INSERT INTO "LibraryFolder" (
  "id",
  "userId",
  "parentId",
  "name",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  'folder_' || md5("id"),
  "userId",
  NULL,
  "name",
  0,
  "createdAt",
  "updatedAt"
FROM "Bookshelf"
WHERE "name" <> '기본 책장';

ALTER TABLE "UserPaper" ADD COLUMN "id" TEXT;
ALTER TABLE "UserPaper" ADD COLUMN "userId" TEXT;
ALTER TABLE "UserPaper" ADD COLUMN "folderId" TEXT;
ALTER TABLE "UserPaper" ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "UserPaper" AS up
SET
  "id" = 'library_paper_' || md5(up."bookshelfId" || ':' || up."paperId"),
  "userId" = b."userId",
  "folderId" = CASE
    WHEN b."name" = '기본 책장' THEN NULL
    ELSE 'folder_' || md5(b."id")
  END,
  "updatedAt" = up."createdAt"
FROM "Bookshelf" AS b
WHERE up."bookshelfId" = b."id";

ALTER TABLE "UserPaper" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "UserPaper" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "UserPaper" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "UserPaper" DROP CONSTRAINT IF EXISTS "UserPaper_pkey";
ALTER TABLE "UserPaper" DROP CONSTRAINT IF EXISTS "UserPaper_bookshelfId_fkey";
DROP INDEX IF EXISTS "UserPaper_paperId_idx";

ALTER TABLE "UserPaper" DROP COLUMN "bookshelfId";
ALTER TABLE "UserPaper" ADD CONSTRAINT "UserPaper_pkey" PRIMARY KEY ("id");

DROP TABLE "Bookshelf";

CREATE UNIQUE INDEX "LibraryFolder_userId_parentId_name_key" ON "LibraryFolder"("userId", "parentId", "name");
CREATE INDEX "LibraryFolder_userId_idx" ON "LibraryFolder"("userId");
CREATE INDEX "LibraryFolder_parentId_idx" ON "LibraryFolder"("parentId");
CREATE UNIQUE INDEX "UserPaper_userId_paperId_folderId_key" ON "UserPaper"("userId", "paperId", "folderId");
CREATE INDEX "UserPaper_userId_idx" ON "UserPaper"("userId");
CREATE INDEX "UserPaper_paperId_idx" ON "UserPaper"("paperId");
CREATE INDEX "UserPaper_folderId_idx" ON "UserPaper"("folderId");

ALTER TABLE "LibraryFolder"
  ADD CONSTRAINT "LibraryFolder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LibraryFolder"
  ADD CONSTRAINT "LibraryFolder_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "LibraryFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPaper"
  ADD CONSTRAINT "UserPaper_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPaper"
  ADD CONSTRAINT "UserPaper_folderId_fkey"
  FOREIGN KEY ("folderId") REFERENCES "LibraryFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
