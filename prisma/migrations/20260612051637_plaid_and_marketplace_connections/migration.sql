-- AlterTable
ALTER TABLE "bank_account" ADD COLUMN "plaidAccessToken" TEXT;
ALTER TABLE "bank_account" ADD COLUMN "plaidAccountId" TEXT;
ALTER TABLE "bank_account" ADD COLUMN "plaidCursor" TEXT;
ALTER TABLE "bank_account" ADD COLUMN "plaidItemId" TEXT;

-- CreateTable
CREATE TABLE "marketplace_connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpires" DATETIME,
    "externalUser" TEXT,
    "lastImportAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "marketplace_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_connection_userId_marketplace_key" ON "marketplace_connection"("userId", "marketplace");
