CREATE TYPE "SignupMethod" AS ENUM ('EMAIL', 'KAKAO');

ALTER TABLE "User"
ADD COLUMN "signupMethod" "SignupMethod" NOT NULL DEFAULT 'EMAIL';

UPDATE "User"
SET "signupMethod" = CASE
  WHEN "authType" = 'OAUTH' THEN 'KAKAO'::"SignupMethod"
  ELSE 'EMAIL'::"SignupMethod"
END;

UPDATE "User"
SET "email" = NULL
WHERE "authType" = 'OAUTH' AND "passwordHash" IS NULL;

ALTER TABLE "User"
DROP COLUMN "authType";

DROP TYPE "UserAuthType";

ALTER TABLE "OAuthAccount"
DROP COLUMN "providerEmail",
DROP COLUMN "providerNickname",
DROP COLUMN "rawProfile";
