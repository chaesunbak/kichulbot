DELETE FROM "User" WHERE "authType" = 'ANONYMOUS';

ALTER TABLE "User" ALTER COLUMN "authType" DROP DEFAULT;

CREATE TYPE "UserAuthType_new" AS ENUM ('EMAIL', 'OAUTH');

ALTER TABLE "User"
  ALTER COLUMN "authType" TYPE "UserAuthType_new"
  USING "authType"::text::"UserAuthType_new";

DROP TYPE "UserAuthType";

ALTER TYPE "UserAuthType_new" RENAME TO "UserAuthType";

ALTER TABLE "User" ALTER COLUMN "authType" SET DEFAULT 'EMAIL';
