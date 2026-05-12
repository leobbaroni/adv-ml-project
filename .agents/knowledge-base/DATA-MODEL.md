# Data Model

Source of truth: `APP/packages/db/prisma/schema.prisma`. This file documents intent.

## Property
- `id` cuid
- `name` string (unique per user — v1 is single-user, so globally unique)
- `address`, `city`, `country` strings
- `ownerName`, `ownerContact` optional strings
- `notes` text (markdown allowed)
- `createdAt`, `updatedAt`

Has many: `ICalSource`, `Reservation`, `ShoppingItem`, `PropertyNote`.

## ICalSource
- `id` cuid
- `propertyId` FK
- `label` enum: `AIRBNB | BOOKING | VRBO | INTERHOME | OTHER`
- `url` text (contains secrets — never log, never render in client)
- `active` bool
- `lastFetchedAt`, `lastEtag`, `lastError` (text, nullable)

## Reservation
Parsed from iCal — not directly user-edited.
- `id` cuid
- `propertyId` FK
- `sourceId` FK (the iCal source that produced it)
- `externalUid` string (the VEVENT UID; deduplication key with sourceId)
- `summary` string
- `startDate`, `endDate` date
- `status` enum: `CONFIRMED | BLOCKED | SUPPRESSED`
- `suppressionReason` enum nullable: `DUPLICATE | AIRBNB_SAME_DAY_BLOCK | AI_RESOLVED | MANUAL`
- `lastSeenAt` timestamp
- Composite unique: `(sourceId, externalUid)`

## OverlapDecision
- `id` cuid
- `propertyId` FK
- `reservationIds` string[] (cuids of involved reservations)
- `action` enum: `DROP_DUPLICATE | SUPPRESS_BLOCK | AI_PROPOSED | KEEP | MANUAL_OVERRIDE`
- `aiRationale` text nullable
- `createdByAi` bool
- `acceptedByUser` bool default false
- `revertedAt` timestamp nullable
- `createdAt`

## CheckInForm
One per Reservation, lazily created.
- `id` cuid
- `reservationId` FK unique
- `fullName`, `country`, `citizenId`, `dob` (nullable until filled)
- `filledVia` enum: `WEB | CHAT | GUEST_LINK | MANUAL` nullable
- `guestLinkToken` string nullable (JWT)
- `guestLinkExpiresAt` timestamp nullable
- `submittedAt` timestamp nullable

## ShoppingItem
- `id` cuid
- `propertyId` FK
- `name` string
- `qty` int default 1
- `unitPrice` decimal nullable
- `ikeaUrl` text nullable
- `status` enum: `PROPOSED | ORDERED`
- `source` enum: `CHAT | WEB`
- `createdAt`

## Notification
- `id` cuid
- `kind` enum: `OVERLAP | CHAT_REQUEST | ORDER_UPDATE`
- `severity` enum: `INFO | WARNING | CRITICAL`
- `propertyId` FK nullable
- `payload` json
- `readAt` timestamp nullable
- `createdAt`

## PropertyNote
- `id` cuid
- `propertyId` FK
- `body` text
- `done` bool default false
- `createdVia` enum: `WEB | CHAT`
- `createdAt`

## ChatMessage
Audit trail for the Telegram bot.
- `id` cuid
- `direction` enum: `INBOUND | OUTBOUND`
- `telegramUserId` string
- `text` text
- `aiAction` string nullable (e.g. `SHOPPING_ADDED`, `OVERLAP_REVERTED`)
- `relatedEntityId` string nullable
- `createdAt`
