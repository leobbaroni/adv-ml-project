# iCal Merge & Overlap Specification

The merge engine is **deterministic**. The AI is an explainer and an escalator, never the merger.

## Pipeline

1. **Fetch** each `ICalSource` for a property (parallel, ETag-aware, 10s timeout each).
2. **Parse** with `node-ical`. Skip events with missing/invalid `DTSTART` or `DTEND`. Log the parse error to `ICalSource.lastError`.
3. **Normalize** each VEVENT into:
   ```
   { externalUid, sourceId, summary, startDate, endDate }
   ```
   - Strip time components — we work in date-only (check-in day, check-out day).
   - For events where end <= start, set `endDate = startDate + 1 day`.
4. **Upsert** by `(sourceId, externalUid)`. Update `lastSeenAt`. Events present in DB but absent from the latest fetch get marked stale (kept, not deleted — Airbnb sometimes drops events for hours).
5. **Detect overlaps** for the property: any two `CONFIRMED|BLOCKED` reservations where `[startA, endA) ∩ [startB, endB) ≠ ∅`.
6. **Auto-resolve** (no AI needed):
   - **R1 — Exact duplicate**: same `(startDate, endDate)`, different `sourceId`. Keep the one with the most informative summary (longest non-empty), suppress the others with `suppressionReason = DUPLICATE`.
   - **R2 — Same-day Airbnb block**: a `BLOCKED` event of length 1 day from an Airbnb source overlapping a `CONFIRMED` event from any source on the same day → suppress the block with `suppressionReason = AIRBNB_SAME_DAY_BLOCK`.
   - **R3 — Adjacent (back-to-back) bookings** (end of A == start of B) → not an overlap. Pass through.
7. **Escalate to AI** for everything else:
   - Partial overlaps with different lengths
   - Multi-day overlaps from different platforms
   - Suspicious-looking 1-day events that don't match R2
   The AI returns:
   ```ts
   { action: 'SUPPRESS' | 'KEEP_BOTH' | 'NEEDS_HUMAN', targetReservationId?: string, rationale: string }
   ```
   We store this as an `OverlapDecision` with `createdByAi=true`, `acceptedByUser=false`. The user gets a Telegram alert + a notification with **Accept** / **Revert** buttons.
8. **Reversibility**: setting `revertedAt` on a decision restores the suppressed reservations to their previous status. Stored as a single column update — no event sourcing needed for v1.

## Failure modes

- AI unavailable → log, store decision as `AI_PROPOSED` with rationale `"AI unavailable; manual review needed"`. The user always sees the overlap; nothing is silently dropped.
- iCal source returns 4xx/5xx → mark `lastError`, skip this cycle, retry next tick.
- Parse error on a single VEVENT → skip that event, continue with the rest of the file.

## Test fixtures

Pure functions in `@app/ical` are tested against handcrafted `.ics` strings under `packages/ical/src/__tests__/fixtures/`.
