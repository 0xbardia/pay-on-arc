-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN "chainId" INTEGER,
ADD COLUMN "connectorName" TEXT,
ADD COLUMN "lastConnectedAt" TIMESTAMP(3),
ALTER COLUMN "network" SET DEFAULT 'evm';

-- CreateIndex
CREATE INDEX "Wallet_chainId_idx" ON "Wallet"("chainId");
