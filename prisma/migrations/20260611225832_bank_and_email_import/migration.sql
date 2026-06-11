-- AlterTable
ALTER TABLE "user" ADD COLUMN "importEmailAddress" TEXT;

-- CreateTable
CREATE TABLE "bank_account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "institution" TEXT,
    "last4" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bank_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bank_transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "aiSuggestion" TEXT,
    "aiCategory" TEXT,
    "aiItemName" TEXT,
    "aiConfidence" REAL,
    "aiRationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "linkedExpenseId" TEXT,
    "linkedItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bank_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bank_transaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "bank_account_userId_idx" ON "bank_account"("userId");

-- CreateIndex
CREATE INDEX "bank_transaction_userId_status_idx" ON "bank_transaction"("userId", "status");

-- CreateIndex
CREATE INDEX "bank_transaction_userId_date_idx" ON "bank_transaction"("userId", "date");
