# Roadmap

Phased, each phase demo-able. Cut-lines marked. Update status as phases complete.

| # | Phase | Status |
|---|---|---|
| 0 | Scaffold (monorepo, Docker, empty Next.js boots) | DONE |
| 1 | Properties CRUD + iCal sources UI + manual "fetch now" | DONE |
| 2 | Merged calendar view + deterministic overlap detection (R1, R2, R3) | DONE |
| 3 | AI overlap resolver + audit log + reversibility | TODO |
| 4 | Printable schedule table (window picker, red overlaps, grey "Next") | TODO |
| 5 | Check-in forms: web edit + magic-link guest page + PDF render | TODO |
| 6 | Telegram bot — overlap alerts + Accept/Revert inline buttons | TODO |
| 7 | Telegram bot — shopping parser → IKEA orders invoice view *(cut-line)* | TODO |
| 8 | Telegram bot — `/form <id>` returns PDF *(cut-line)* | TODO |
| 9 | Notifications center + R3F hero + polish | TODO |
| 10 | Business plan + GenAI log + pitch deck | TODO |

## Phase 0 — Done when

- `docker compose up` brings up postgres + redis + web + worker, all healthy.
- `http://localhost:3000` renders the landing page with no console errors.
- `pnpm --filter @app/db migrate dev` applies migration 1 (all models from DATA-MODEL.md).
- `pnpm --filter @app/db seed:local` loads Triplex + Nanoush properties and their iCal sources.
- `pnpm --filter @app/ical test` passes (placeholder test).
- Worker process starts, connects to Redis, logs `[worker] ready`.

## Phase 1 — Done when

- User can create/edit/delete a Property in the UI.
- User can add/remove iCal sources for a property.
- "Fetch now" button triggers `pollIcal` job; events appear in DB.
- `pnpm test` passes.

## Phase 2 — Done when

- Property detail page renders a merged calendar view of all reservations across sources for that property.
- `packages/ical/src/overlaps.ts` implements all three deterministic rules from `ICAL-MERGE-SPEC.md`: R1 (exact duplicate — already done in Phase 1), R2 (same-day Airbnb `BLOCKED` overlapping `CONFIRMED`), R3 (back-to-back adjacency is not an overlap).
- Overlap detection runs automatically after every `pollIcal` job completes (in the worker, not the web).
- Suppressed reservations are marked with `suppressionReason` and visually distinguished in the calendar.
- Auto-resolved decisions are recorded as `OverlapDecision` rows with `createdByAi=false`.
- Unit tests cover R1, R2, R3 with fixture-driven cases.
- Anything not auto-resolved is listed as a pending overlap in the UI (no AI yet — that's Phase 3).

(Subsequent phases will be filled out with done-criteria when started.)
