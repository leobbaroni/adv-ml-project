# iCal Overlap Rules — Plain Language

Full spec: `.agents/knowledge-base/ICAL-MERGE-SPEC.md`. This document is a friendly summary.

## The problem

When you sync the same property to Airbnb, Booking, VRBO, and Interhome, each platform exports its own iCal feed. When a guest books on Airbnb, Airbnb adds the dates to its feed AND pushes a "blocked" range to the other platforms' feeds. The other platforms then re-export it back. This creates **overlaps** — the same dates appearing two or three times.

Most overlaps are harmless (just duplicates) but some are real conflicts (a double-booking).

## Our approach

We never edit the source calendars. We merge them into **one view** per property and:

1. **Silently drop the obvious duplicates** (same dates, multiple sources).
2. **Silently drop Airbnb same-day blocks** that line up with a confirmed reservation elsewhere.
3. **Ask the AI** to look at anything ambiguous and propose a resolution.
4. **Notify you on Telegram** with an Accept / Revert button.

Everything is reversible. No data is deleted; suppressed events are just hidden.

## Rule R1 — Exact duplicate

| | |
|---|---|
| **Trigger** | Two events on a property have identical `startDate` and `endDate` but come from different `ICalSource`s. |
| **Action** | Keep the event with the most informative summary (longest non-empty). Suppress the rest with `suppressionReason = DUPLICATE`. |
| **Reversible** | Yes — set status back to original. |
| **AI involved** | No. |

## Rule R2 — Airbnb same-day block

| | |
|---|---|
| **Trigger** | A 1-day `BLOCKED` event from the Airbnb source overlaps a `CONFIRMED` event on the same day. |
| **Action** | Suppress the block. The confirmed reservation wins. |
| **Reversible** | Yes. |
| **AI involved** | No. |

## Rule R3 — Back-to-back

| | |
|---|---|
| **Trigger** | Event A's `endDate` equals event B's `startDate`. (One guest checks out, another checks in the same day.) |
| **Action** | Not an overlap. Pass through. |
| **AI involved** | No. |

## Everything else → AI

If two events overlap and don't match R1, R2, or R3, the AI gets called. It returns one of:

- `SUPPRESS` (with which event to hide and why)
- `KEEP_BOTH` (it's intentional — e.g. two separate platforms intentionally cross-promoting)
- `NEEDS_HUMAN` (it can't tell — flag for you)

You get a Telegram message with the AI's reasoning and two buttons: **Accept** or **Revert**. If you revert, the suppression is undone.

## Failure modes

- **AI down**: every ambiguous overlap becomes `NEEDS_HUMAN`. Nothing is dropped silently.
- **iCal source 5xx**: skip this poll cycle. Don't delete events that were there last time.
- **One VEVENT in a feed is malformed**: skip that event, keep parsing the rest.
