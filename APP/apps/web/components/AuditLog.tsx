'use client';

import { RotateCcw } from 'lucide-react';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/lib/trpc/server';
import { trpc } from '@/lib/trpc/react';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type HistoryItem = RouterOutputs['overlap']['history'][number];

const ACTION_LABELS: Record<string, string> = {
  DROP_DUPLICATE: 'Drop duplicate',
  SUPPRESS_BLOCK: 'Suppress blocked',
  AI_PROPOSED: 'AI proposed — review needed',
  KEEP: 'Keep both',
  MANUAL_OVERRIDE: 'Manual override',
};

interface AuditLogProps {
  propertyId: string;
}

export function AuditLog({ propertyId }: AuditLogProps) {
  const history = trpc.overlap.history.useQuery({ propertyId });
  const utils = trpc.useUtils();

  const revert = trpc.overlap.revert.useMutation({
    onSuccess: () => {
      void utils.overlap.history.invalidate({ propertyId });
      void utils.ical.pendingOverlapsByProperty.invalidate({ propertyId });
      void utils.ical.calendarByProperty.invalidate({ propertyId });
    },
  });

  if (history.isLoading) {
    return <p className="text-fg-muted text-sm">Loading audit log…</p>;
  }

  const items = history.data ?? [];

  if (items.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">No overlap decisions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {items.map((item) => {
        const canRevert = item.acceptedByUser && !item.revertedAt;
        const isReverting = revert.isPending && revert.variables?.decisionId === item.id;

        return (
          <div key={item.id} className="surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-fg">
                  {ACTION_LABELS[item.action] ?? item.action}
                </p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {formatDateTime(item.createdAt)}
                </p>
                {item.aiRationale && (
                  <p className="text-xs text-fg-muted mt-1 italic">“{item.aiRationale}”</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge item={item} />
                {canRevert && (
                  <button
                    type="button"
                    onClick={() => revert.mutate({ decisionId: item.id })}
                    disabled={isReverting}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-btn bg-danger text-white hover:bg-danger/90 disabled:opacity-60 transition-colors text-[10px] font-medium"
                  >
                    <RotateCcw size={12} />
                    {isReverting ? 'Reverting…' : 'Revert'}
                  </button>
                )}
              </div>
            </div>

            {item.reservations.length > 0 && (
              <div className="mt-3 space-y-2">
                {item.reservations.map((r) => {
                  const isKept = item.reservationIds[0] === r.id;
                  const isDropped = item.reservationIds[1] === r.id;
                  return (
                    <div
                      key={r.id}
                      className={[
                        'flex items-center gap-3 text-xs rounded-btn px-3 py-2 border',
                        isDropped
                          ? 'bg-danger/5 border-danger/20'
                          : isKept
                            ? 'bg-ok/5 border-ok/20'
                            : 'bg-bg border-bg-border',
                      ].join(' ')}
                    >
                      <span className="inline-flex items-center h-5 px-1.5 rounded-sm bg-bg-surface border border-bg-border text-[10px] font-medium text-fg-muted">
                        {r.source.label}
                      </span>
                      <span className="text-fg truncate">{r.summary}</span>
                      {isDropped && (
                        <span className="shrink-0 inline-flex items-center h-5 px-1.5 rounded-sm bg-danger text-white text-[10px] font-medium uppercase tracking-wider">
                          Removed
                        </span>
                      )}
                      {isKept && (
                        <span className="shrink-0 inline-flex items-center h-5 px-1.5 rounded-sm bg-ok text-white text-[10px] font-medium uppercase tracking-wider">
                          Kept
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

function StatusBadge({ item }: { item: HistoryItem }) {
  if (item.revertedAt) {
    return (
      <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full bg-danger text-white text-[10px] font-medium tracking-wider">
        Reverted
      </span>
    );
  }

  if (item.acceptedByUser) {
    return (
      <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full bg-ok text-white text-[10px] font-medium tracking-wider">
        Accepted
      </span>
    );
  }

  return (
    <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full bg-warn text-white text-[10px] font-medium tracking-wider">
      Pending
    </span>
  );
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(d: Date): string {
  const date = formatDate(d);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${date} ${h}:${min}`;
}
