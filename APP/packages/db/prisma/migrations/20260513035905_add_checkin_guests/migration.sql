/*
  Warnings:

  - You are about to drop the column `citizenId` on the `CheckInForm` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `CheckInForm` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `CheckInForm` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `CheckInForm` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CheckInForm" DROP COLUMN "citizenId",
DROP COLUMN "country",
DROP COLUMN "dob",
DROP COLUMN "fullName";

-- CreateTable
CREATE TABLE "CheckInGuest" (
    "id" TEXT NOT NULL,
    "checkInFormId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckInGuest_checkInFormId_idx" ON "CheckInGuest"("checkInFormId");

-- AddForeignKey
ALTER TABLE "CheckInGuest" ADD CONSTRAINT "CheckInGuest_checkInFormId_fkey" FOREIGN KEY ("checkInFormId") REFERENCES "CheckInForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
