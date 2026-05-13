-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('PROPOSED', 'QUOTED', 'APPROVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RepairSource" AS ENUM ('CHAT', 'WEB');

-- CreateTable
CREATE TABLE "RepairEstimate" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL,
    "status" "RepairStatus" NOT NULL DEFAULT 'PROPOSED',
    "source" "RepairSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepairEstimate_propertyId_status_idx" ON "RepairEstimate"("propertyId", "status");

-- AddForeignKey
ALTER TABLE "RepairEstimate" ADD CONSTRAINT "RepairEstimate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
