-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CLOSET_CREATED', 'CLOSET_RENAMED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'MEMBER_REMOVED', 'ITEM_ADDED', 'ITEM_LISTED', 'ITEM_SOLD', 'ITEM_UNLISTED', 'ITEM_PRICE_CHANGED', 'ITEM_RELISTED', 'ITEM_DELETED');

-- AlterTable
ALTER TABLE "Closet" ADD COLUMN     "staleDays" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "ClosetMember" ADD COLUMN     "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "refreshedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "closetId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "type" "ActivityType" NOT NULL,
    "itemId" INTEGER,
    "itemName" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_closetId_createdAt_idx" ON "Activity"("closetId", "createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_closetId_fkey" FOREIGN KEY ("closetId") REFERENCES "Closet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
