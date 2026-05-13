'use client';

interface FlatReservation {
  id: string;
  property: { id: string; name: string };
  summary: string;
  startDate: Date;
  endDate: Date;
  sourceLabel: string;
  status: string;
  nextCheckIn: Date | null;
  hasActiveOverlap?: boolean;
}

interface MiniScheduleProps {
  reservations: FlatReservation[];
  loading?: boolean;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—';
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function MiniSchedule({ reservations, loading }: MiniScheduleProps) {
  if (loading) {
    return (
      <div className="surface p-4">
        <p className="text-fg-muted text-sm">Loading schedule…</p>
      </div>
    );
  }

  const upcoming = reservations.slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="surface p-4">
        <p className="text-fg-muted text-sm">No upcoming reservations</p>
      </div>
    );
  }

  return (
    <div className="surface p-4 space-y-3">
      <h3 className="text-sm font-semibold tracking-tightish">Upcoming reservations</h3>
      <div className="space-y-2">
        {upcoming.map((r) => {
          const isSuppressed = r.status === 'SUPPRESSED';
          return (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className={['truncate', isSuppressed ? 'line-through text-fg-muted' : 'text-fg'].join(' ')}>
                  {r.summary}
                </p>
                <p className="text-xs text-fg-muted tabular-nums">
                  {formatDate(r.startDate)} → {formatDate(r.endDate)}
                </p>
              </div>
              <span className="inline-flex items-center h-5 px-1.5 rounded-sm bg-bg-surface border border-bg-border text-[10px] font-medium text-fg-muted ml-3 shrink-0">
                {r.sourceLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
