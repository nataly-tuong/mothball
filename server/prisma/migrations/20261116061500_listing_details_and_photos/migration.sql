-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "condition" "ItemCondition",
ADD COLUMN     "depopUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "listedAt" TIMESTAMP(3),
ADD COLUMN     "minPriceCents" INTEGER,
ADD COLUMN     "ownerId" INTEGER,
ADD COLUMN     "soldAt" TIMESTAMP(3),
ADD COLUMN     "soldPriceCents" INTEGER;

-- CreateTable
CREATE TABLE "ItemPhoto" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemPhoto_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ItemPhoto" ("itemId", "url", "publicId", "position")
SELECT "id", "imageUrl", "imagePublicId", 0
FROM "Item"
WHERE "imageUrl" IS NOT NULL AND "imagePublicId" IS NOT NULL;

UPDATE "Item" SET "listedAt" = "updatedAt" WHERE "status" IN ('LISTED', 'SOLD');
UPDATE "Item" SET "soldAt" = "updatedAt" WHERE "status" = 'SOLD';

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "imagePublicId",
DROP COLUMN "imageUrl";

-- CreateIndex
CREATE UNIQUE INDEX "ItemPhoto_publicId_key" ON "ItemPhoto"("publicId");

-- CreateIndex
CREATE INDEX "ItemPhoto_itemId_position_idx" ON "ItemPhoto"("itemId", "position");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPhoto" ADD CONSTRAINT "ItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
