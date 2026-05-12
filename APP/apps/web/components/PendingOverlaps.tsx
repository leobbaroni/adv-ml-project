'use client';

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/lib/trpc/server';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Overlap = RouterOutputs['ical']['pendingOverlapsByProperty'][number];
type Reservation = RouterOutputs['ical']['calendarByProperty'][number];

interface PendingOverlapsProps {
  overlaps: Overlap[];
  reservations: Reservation[];
  loading?: boolean;
}

export function PendingOverlaps({ overlaps, reservations, loading }: PendingOverlapsProps) {
  if (loading) {
    return <p className="text-fg-muted text-sm">Loading overlaps…</p>;
  }

  if (overlaps.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">No pending overlaps. Everything looks clear.</p>
      </div>
    );
  }

  const resMap = new Map(reservations.map((r) => [r.id, r]));

  return (
    <div className="space-y-3">
      {overlaps.map((o) => {
        const involved = o.reservationIds
          .map((id) => resMap.get(id))
          .filter(Boolean) as Reservation[];

        return (
          <div key={o.id} className="surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-fg">
                  Overlap detected
                </p>
                <p className="text-xs text-fg-muted mt-0.5">
                  Action proposed: <span className="text-fg font-medium">{o.action}</span>
                  {o.createdByAi && (
                    <span className="ml-2 text-accent">AI-suggested</span>
                  )}
                </p>
                {o.aiRationale && (
                  <p className="text-xs text-fg-muted mt-1 italic">“{o.aiRationale}”</p>
                )}
              </div>
              <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full border border-warn/30 bg-warn/10 text-warn text-[10px] font-medium tracking-wider">
                Needs review
              </span>
            </div>

            {involved.length > 0 && (
              <div className="mt-3 space-y-2">
                {involved.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 text-xs bg-bg border border-bg-border rounded-btn px-3 py-2"
                  >
                    <span className="inline-flex items-center h-5 px-1.5 rounded-sm bg-bg-surface border border-bg-border text-[10px] font-medium text-fg-muted">
                      {r.source.label}
                    </span>
                    <span className="text-fg truncate">{r.summary}</span>
                    <span className="text-fg-muted tabular-nums ml-auto">
                      {formatDate(r.startDate)} → {formatDate(r.endDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
