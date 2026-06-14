-- AlterTable
ALTER TABLE "User"
ADD COLUMN "merchantName" TEXT,
ADD COLUMN "merchantSlug" TEXT,
ADD COLUMN "merchantEmail" TEXT,
ADD COLUMN "supportEmail" TEXT,
ADD COLUMN "websiteUrl" TEXT,
ADD COLUMN "logoUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_merchantSlug_key" ON "User"("merchantSlug");
