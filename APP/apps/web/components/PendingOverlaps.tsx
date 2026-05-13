'use client';

import { Check, RotateCcw } from 'lucide-react';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/lib/trpc/server';
import { trpc } from '@/lib/trpc/react';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Overlap = RouterOutputs['ical']['pendingOverlapsByProperty'][number];
type Reservation = RouterOutputs['ical']['calendarByProperty'][number];

const ACTION_LABELS: Record<string, string> = {
  DROP_DUPLICATE: 'Drop duplicate',
  SUPPRESS_BLOCK: 'Suppress blocked',
  AI_PROPOSED: 'AI proposed — review needed',
  KEEP: 'Keep both',
  MANUAL_OVERRIDE: 'Manual override',
};

interface PendingOverlapsProps {
  overlaps: Overlap[];
  reservations: Reservation[];
  propertyId: string;
  loading?: boolean;
}

export function PendingOverlaps({ overlaps, reservations, propertyId, loading }: PendingOverlapsProps) {
  const utils = trpc.useUtils();

  const accept = trpc.overlap.accept.useMutation({
    onSuccess: () => {
      void utils.ical.pendingOverlapsByProperty.invalidate({ propertyId });
      void utils.overlap.history.invalidate({ propertyId });
      void utils.ical.calendarByProperty.invalidate({ propertyId });
    },
  });

  const revert = trpc.overlap.revert.useMutation({
    onSuccess: () => {
      void utils.ical.pendingOverlapsByProperty.invalidate({ propertyId });
      void utils.overlap.history.invalidate({ propertyId });
      void utils.ical.calendarByProperty.invalidate({ propertyId });
    },
  });

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
          .filter((r): r is Reservation => {
            if (!r) return false;
            return r.status !== 'SUPPRESSED';
          });

        const isAccepting = accept.isPending && accept.variables?.decisionId === o.id;
        const isReverting = revert.isPending && revert.variables?.decisionId === o.id;

        // reservationIds[0] = KEEP (green), reservationIds[1] = DROP (red)
        const keepId = o.reservationIds[0];
        const dropId = o.reservationIds[1];

        return (
          <div key={o.id} className="surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg">
                  Booking overlap detected
                </p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {o.action === 'AI_PROPOSED' ? (
                    <>
                      AI recommends: <span className="text-fg font-medium">{ACTION_LABELS[o.action] ?? o.action}</span>
                      {o.createdByAi && (
                        <span className="ml-2 text-accent">AI-suggested</span>
                      )}
                    </>
                  ) : o.action === 'KEEP' ? (
                    <>
                      Decision: <span className="text-ok font-medium">Keep both reservations</span>
                    </>
                  ) : (
                    <>
                      Proposed action: <span className="text-fg font-medium">{ACTION_LABELS[o.action] ?? o.action}</span>
                    </>
                  )}
                </p>
                {o.aiRationale && (
                  <p className="text-xs text-fg-muted mt-1 italic">“{o.aiRationale}”</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => accept.mutate({ decisionId: o.id })}
                  disabled={isAccepting || isReverting}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-btn border border-ok/40 text-ok hover:bg-ok/10 disabled:opacity-60 transition-colors text-xs font-medium"
                >
                  <Check size={14} />
                  {isAccepting ? 'Accepting…' : 'Accept'}
                </button>
                <button
                  type="button"
                  onClick={() => revert.mutate({ decisionId: o.id })}
                  disabled={isAccepting || isReverting}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-btn border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-60 transition-colors text-xs font-medium"
                >
                  <RotateCcw size={14} />
                  {isReverting ? 'Reverting…' : 'Revert'}
                </button>
              </div>
            </div>

            {involved.length > 0 && (
              <div className="mt-3 space-y-2">
                {involved.map((r) => {
                  const isDrop = r.id === dropId;
                  const isKeep = r.id === keepId;
                  return (
                    <div
                      key={r.id}
                      className={[
                        'flex items-center gap-3 text-xs rounded-btn px-3 py-2 border',
                        isDrop
                          ? 'bg-danger/5 border-danger/30'
                          : isKeep
                            ? 'bg-ok/5 border-ok/30'
                            : 'bg-bg border-bg-border',
                      ].join(' ')}
                    >
                      <span className="inline-flex items-center h-5 px-1.5 rounded-sm bg-bg-surface border border-bg-border text-[10px] font-medium text-fg-muted">
                        {r.source.label}
                      </span>
                      <span className="text-fg truncate">{r.summary}</span>
                      {isDrop && (
                        <span className="shrink-0 text-[10px] font-medium text-danger uppercase tracking-wider">
                          Remove
                        </span>
                      )}
                      {isKeep && (
                        <span className="shrink-0 text-[10px] font-medium text-ok uppercase tracking-wider">
                          Keep
                        </span>
                      )}
                      <span className="text-fg-muted tabular-nums ml-auto">
                        {formatDate(r.startDate)} → {formatDate(r.endDate)}
                      </span>
                    </div>
                  );
                })}
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
