INSERT INTO "CheckInForm" ("id", "reservationId", "guestLinkToken", "guestLinkExpiresAt")
VALUES (gen_random_uuid()::text, 'cmp3ews59006vnuhptaeec0si', encode(gen_random_bytes(24), 'hex'), '2026-12-31')
ON CONFLICT ("reservationId") DO UPDATE SET
  "guestLinkToken" = EXCLUDED."guestLinkToken",
  "guestLinkExpiresAt" = EXCLUDED."guestLinkExpiresAt"
RETURNING "guestLinkToken";
