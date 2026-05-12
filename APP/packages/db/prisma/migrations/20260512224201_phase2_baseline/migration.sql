-- CreateEnum
CREATE TYPE "ICalLabel" AS ENUM ('AIRBNB', 'BOOKING', 'VRBO', 'INTERHOME', 'OTHER');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'BLOCKED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "SuppressionReason" AS ENUM ('DUPLICATE', 'AIRBNB_SAME_DAY_BLOCK', 'AI_RESOLVED', 'MANUAL');

-- CreateEnum
CREATE TYPE "OverlapAction" AS ENUM ('DROP_DUPLICATE', 'SUPPRESS_BLOCK', 'AI_PROPOSED', 'KEEP', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "FilledVia" AS ENUM ('WEB', 'CHAT', 'GUEST_LINK', 'MANUAL');

-- CreateEnum
CREATE TYPE "ShoppingStatus" AS ENUM ('PROPOSED', 'ORDERED');

-- CreateEnum
CREATE TYPE "ShoppingSource" AS ENUM ('CHAT', 'WEB');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('OVERLAP', 'CHAT_REQUEST', 'ORDER_UPDATE');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NoteOrigin" AS ENUM ('WEB', 'CHAT');

-- CreateEnum
CREATE TYPE "ChatDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "ownerName" TEXT,
    "ownerContact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICalSource" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "label" "ICalLabel" NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastFetchedAt" TIMESTAMP(3),
    "lastEtag" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ICalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalUid" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "suppressionReason" "SuppressionReason",
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverlapDecision" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "reservationIds" TEXT[],
    "action" "OverlapAction" NOT NULL,
    "aiRationale" TEXT,
    "createdByAi" BOOLEAN NOT NULL DEFAULT false,
    "acceptedByUser" BOOLEAN NOT NULL DEFAULT false,
    "revertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OverlapDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInForm" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "fullName" TEXT,
    "country" TEXT,
    "citizenId" TEXT,
    "dob" DATE,
    "filledVia" "FilledVia",
    "guestLinkToken" TEXT,
    "guestLinkExpiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2),
    "ikeaUrl" TEXT,
    "status" "ShoppingStatus" NOT NULL DEFAULT 'PROPOSED',
    "source" "ShoppingSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "severity" "NotificationSeverity" NOT NULL,
    "propertyId" TEXT,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyNote" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdVia" "NoteOrigin" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "direction" "ChatDirection" NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "aiAction" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_name_key" ON "Property"("name");

-- CreateIndex
CREATE INDEX "ICalSource_propertyId_idx" ON "ICalSource"("propertyId");

-- CreateIndex
CREATE INDEX "Reservation_propertyId_startDate_idx" ON "Reservation"("propertyId", "startDate");

-- CreateIndex
CREATE INDEX "Reservation_propertyId_status_idx" ON "Reservation"("propertyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_sourceId_externalUid_key" ON "Reservation"("sourceId", "externalUid");

-- CreateIndex
CREATE INDEX "OverlapDecision_propertyId_createdAt_idx" ON "OverlapDecision"("propertyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInForm_reservationId_key" ON "CheckInForm"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInForm_guestLinkToken_key" ON "CheckInForm"("guestLinkToken");

-- CreateIndex
CREATE INDEX "ShoppingItem_propertyId_status_idx" ON "ShoppingItem"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Notification_readAt_createdAt_idx" ON "Notification"("readAt", "createdAt");

-- CreateIndex
CREATE INDEX "PropertyNote_propertyId_done_idx" ON "PropertyNote"("propertyId", "done");

-- CreateIndex
CREATE INDEX "ChatMessage_telegramUserId_createdAt_idx" ON "ChatMessage"("telegramUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "ICalSource" ADD CONSTRAINT "ICalSource_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ICalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverlapDecision" ADD CONSTRAINT "OverlapDecision_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInForm" ADD CONSTRAINT "CheckInForm_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyNote" ADD CONSTRAINT "PropertyNote_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
