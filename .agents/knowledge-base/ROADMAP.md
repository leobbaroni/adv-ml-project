# Roadmap

Phased, each phase demo-able. Cut-lines marked. Update status as phases complete.

| # | Phase | Status |
|---|---|---|
| 0 | Scaffold (monorepo, Docker, empty Next.js boots) | DONE |
| 1 | Properties CRUD + iCal sources UI + manual "fetch now" | DONE |
| 2 | Merged calendar view + deterministic overlap detection (R1, R2, R3) | DONE |
| 3 | AI overlap resolver + audit log + reversibility | DONE |
| 4 | Printable schedule table (window picker, red overlaps, grey "Next") | DONE |
| 4b | Fetch-all button + clean insert architecture (delete old → insert fresh → detect overlaps) | DONE |
| 5 | Check-in forms: web edit + magic-link guest page + PDF render | DONE |
| 6 | Telegram bot — overlap alerts + Accept/Revert inline buttons | DONE |
| 7 | Telegram bot — shopping parser → IKEA orders invoice view *(cut-line)* | DONE |
| 8 | Telegram bot — natural-language PDF delivery (check-in + schedule) *(cut-line)* | DONE |
| 9 | Notifications center + R3F hero + polish | DONE |
| 10 | Business plan + GenAI log + pitch deck | DONE |

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

## Phase 4 — Done when

- `/schedule` page renders a table with current + next reservations for all properties.
- Check-in column has a grey background (`bg-bg-surface`).
- Unresolved overlaps show a red warning indicator (red left border + warning icon).
- Window picker shifts the reference date with presets: Today, +30, +60, +90 days.
- "Download PDF" button generates a server-side PDF of the current schedule view.
- Property detail page shows a `<MiniSchedule>` card with current/next guest.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass.

## Phase 5 — Done when

- Property create/edit forms include check-in template fields (Wi-Fi, lock code, arrival instructions).
- Host can generate a magic link per reservation; link expires 7 days after checkout.
- Guest page (`/checkin/<token>`) shows read-only property info + editable multi-guest form.
- Guest form submission stores guests in `CheckInGuest` rows and marks `submittedAt`.
- Host-side check-in forms panel lists reservations with status colors (green = submitted, red = link generated, grey = no link).
- Window picker filters reservations by date range on the check-in forms tab.
- PDF generation (`/api/checkin/pdf`) renders property info + reservation dates + all guests.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass.

## Phase 6 — Done when

- When `poll-ical` creates an `AI_PROPOSED` overlap decision, the worker immediately sends a Telegram message to the admin with reservation details and inline Accept/Revert buttons.
- Pressing **Accept** suppresses the target reservation, marks the decision `acceptedByUser=true`, and edits the message to show "Accepted".
- Pressing **Revert** restores both reservations to `CONFIRMED`, marks the decision `revertedAt=now`, and edits the message to show "Reverted".
- All bot actions are audited in `ChatMessage`.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass.

## Phase 7 — Done when

- `parseShoppingMessage` uses a real AI prompt to extract property name, item names, quantities, and optional IKEA article numbers/URLs from free-text Telegram messages.
- The bot saves parsed items as `ShoppingItem` rows with `source: 'CHAT'`.
- The bot replies with a confirmation message listing the property and items saved.
- Web app has a `shoppingRouter` tRPC router (`list`, `listByProperty`, `updateStatus`, `delete`, `create`).
- `/orders` page shows all shopping items grouped by property with status toggle (PROPOSED ↔ ORDERED) and delete.
- Invoice PDF API (`/api/invoice/pdf`) generates a printable invoice per property with item list, unit prices, and totals.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass.

## Phase 8 — Done when

- `parsePdfRequest` AI task interprets natural-language messages like "check-in form for May 11" or "schedule for this month".
- The bot resolves the request to a specific reservation or schedule window, calls the web PDF API internally, and sends the PDF buffer as a Telegram document.
- If the request is ambiguous, the bot asks a clarifying question instead of guessing.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass.

## Phase 9 — Done when

- Spline 3D hero is implemented and lazy loaded.
- Complete Theme System is built (`next-themes`, CSS variables, ThemeToggle).
- Bot and Worker create notifications for all relevant events.
- Landing page rewritten to showcase features with pitch-deck quality.
- Entire UI has dark/light mode support using updated Tailwind variables.
- Project name is updated to "Rental Buddy".

## Phase 10 — Done when

- All opencode TODOs are cleared from the codebase.
- README.md is rewritten as a professional open-source repo with an AI setup prompt at the top.
- AI-INTEGRATION.md documents every AI task (overlap resolver, shopping parser, PDF request parser, repair estimator, check-in extractor) with prompts and fallback strategies.
- GENAI-LOG.md appendix details AI tool usage (models, costs, prompts, iterations) for the business plan.
- Docs directory is reorganized: `docs/SETUP.md`, `docs/AI-INTEGRATION.md`, `docs/GENAI-LOG.md`, `docs/TELEGRAM-BOT-SETUP.md`, `docs/ICAL-OVERLAP-RULES.md`.
- All `.agents/` knowledge-base files are reviewed and updated for accuracy.
- `pnpm build`, `pnpm typecheck`, `pnpm lint` all pass.

