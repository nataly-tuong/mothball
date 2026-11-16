-- CreateEnum
CREATE TYPE "ClosetRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('TO_UPLOAD', 'LISTED', 'SOLD');

-- CreateTable
CREATE TABLE "Closet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Closet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClosetMember" (
    "closetId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "ClosetRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClosetMember_pkey" PRIMARY KEY ("closetId","userId")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "closetId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "name" TEXT NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'TO_UPLOAD',
    "priceCents" INTEGER,
    "notes" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Closet_inviteCode_key" ON "Closet"("inviteCode");

-- CreateIndex
CREATE INDEX "ClosetMember_userId_idx" ON "ClosetMember"("userId");

-- CreateIndex
CREATE INDEX "Item_closetId_createdAt_idx" ON "Item"("closetId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClosetMember" ADD CONSTRAINT "ClosetMember_closetId_fkey" FOREIGN KEY ("closetId") REFERENCES "Closet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClosetMember" ADD CONSTRAINT "ClosetMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_closetId_fkey" FOREIGN KEY ("closetId") REFERENCES "Closet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
