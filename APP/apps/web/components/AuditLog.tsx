'use client';

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/lib/trpc/server';
import { trpc } from '@/lib/trpc/react';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type HistoryItem = RouterOutputs['overlap']['history'][number];

interface AuditLogProps {
  propertyId: string;
}

export function AuditLog({ propertyId }: AuditLogProps) {
  const history = trpc.overlap.history.useQuery({ propertyId });

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
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="surface p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">
                {item.action}
              </p>
              <p className="text-xs text-fg-muted mt-0.5">
                {formatDateTime(item.createdAt)}
              </p>
              {item.aiRationale && (
                <p className="text-xs text-fg-muted mt-1 italic">“{item.aiRationale}”</p>
              )}
            </div>
            <StatusBadge item={item} />
          </div>

          {item.reservations.length > 0 && (
            <div className="mt-3 space-y-2">
              {item.reservations.map((r) => (
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
      ))}
    </div>
  );
}

function StatusBadge({ item }: { item: HistoryItem }) {
  if (item.revertedAt) {
    return (
      <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full border border-danger/30 bg-danger/10 text-danger text-[10px] font-medium tracking-wider">
        Reverted
      </span>
    );
  }

  if (item.acceptedByUser) {
    return (
      <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full border border-ok/30 bg-ok/10 text-ok text-[10px] font-medium tracking-wider">
        Accepted
      </span>
    );
  }

  return (
    <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full border border-warn/30 bg-warn/10 text-warn text-[10px] font-medium tracking-wider">
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
