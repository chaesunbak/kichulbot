CREATE TABLE "ServiceAccount" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceAccount_name_key" ON "ServiceAccount"("name");
CREATE UNIQUE INDEX "ServiceAccount_tokenHash_key" ON "ServiceAccount"("tokenHash");
CREATE INDEX "ServiceAccount_isActive_idx" ON "ServiceAccount"("isActive");
