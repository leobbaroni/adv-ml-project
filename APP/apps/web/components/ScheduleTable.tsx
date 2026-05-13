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
}

interface ScheduleTableProps {
  rows: FlatReservation[];
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

function SourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center h-6 px-2 rounded-full bg-bg border border-bg-border text-[10px] font-medium tracking-wider text-fg-muted">
      {label}
    </span>
  );
}

export function ScheduleTable({ rows, loading }: ScheduleTableProps) {
  if (loading) {
    return <p className="text-fg-muted text-sm">Loading schedule…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">
          No reservations in this window
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 md:mx-0">
      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b border-bg-border">
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Property
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Check-in
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Check-out
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap bg-bg-surface">
              Next Check-in
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSuppressed = row.status === 'SUPPRESSED';

            return (
              <tr
                key={row.id}
                className={[
                  'border-b border-bg-border',
                  isSuppressed ? 'opacity-50' : '',
                ].join(' ')}
              >
                <td className="px-4 py-3 align-top">
                  <p className="text-sm font-medium text-fg">{row.property.name}</p>
                  <p className="text-xs text-fg-muted">
                    {isSuppressed ? (
                      <span className="line-through">{row.summary}</span>
                    ) : (
                      row.summary
                    )}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className={['text-sm tabular-nums', isSuppressed ? 'line-through text-fg-muted' : 'text-fg'].join(' ')}>
                    {formatDate(row.startDate)}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className={['text-sm tabular-nums', isSuppressed ? 'line-through text-fg-muted' : 'text-fg'].join(' ')}>
                    {formatDate(row.endDate)}
                  </p>
                </td>
                <td className="px-4 py-3 align-top bg-bg-surface">
                  <p className="text-sm text-fg tabular-nums">
                    {formatDate(row.nextCheckIn)}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <SourceBadge label={row.sourceLabel} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
