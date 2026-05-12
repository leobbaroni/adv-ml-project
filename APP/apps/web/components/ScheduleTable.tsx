'use client';

import { AlertTriangle } from 'lucide-react';

interface ScheduleReservation {
  id: string;
  summary: string;
  startDate: Date;
  endDate: Date;
}

interface ScheduleProperty {
  id: string;
  name: string;
  city: string;
  country: string;
}

export interface ScheduleRowData {
  property: ScheduleProperty;
  current: ScheduleReservation | null;
  next: ScheduleReservation | null;
  hasOverlap: boolean;
}

interface ScheduleTableProps {
  rows: ScheduleRowData[];
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

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = new Date(a);
  const end = new Date(b);
  // Normalize to UTC midnight
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function ScheduleTable({ rows, loading }: ScheduleTableProps) {
  if (loading) {
    return <p className="text-fg-muted text-sm">Loading schedule…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-fg-muted text-sm">
          No properties with reservations in this window
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
              Current Guest
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Check-out
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Next Guest
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap bg-bg-surface">
              Check-in
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Turnover
            </th>
            <th className="text-xs text-fg-muted font-medium px-4 py-3 whitespace-nowrap">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const turnover =
              row.current && row.next
                ? daysBetween(row.current.endDate, row.next.startDate)
                : null;

            const turnoverDisplay =
              turnover === null || turnover === 0 ? '—' : `${turnover}d`;

            const turnoverClass =
              turnover === null || turnover === 0
                ? 'text-fg-muted'
                : turnover > 0
                  ? 'text-ok'
                  : 'text-danger';

            return (
              <tr
                key={row.property.id}
                className={[
                  'border-b border-bg-border',
                  row.hasOverlap ? 'border-l-2 border-l-danger' : '',
                ].join(' ')}
              >
                <td className="px-4 py-3 align-top">
                  <p className="text-sm font-medium text-fg">{row.property.name}</p>
                  <p className="text-xs text-fg-muted">
                    {row.property.city}, {row.property.country}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-sm text-fg">
                    {row.current ? row.current.summary : '—'}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-sm text-fg tabular-nums">
                    {formatDate(row.current?.endDate)}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-sm text-fg">
                    {row.next ? row.next.summary : '—'}
                  </p>
                </td>
                <td className="px-4 py-3 align-top bg-bg-surface">
                  <p className="text-sm text-fg tabular-nums">
                    {formatDate(row.next?.startDate)}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={['text-sm font-medium tabular-nums', turnoverClass].join(' ')}>
                    {turnoverDisplay}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  {row.hasOverlap && (
                    <span className="inline-flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle size={14} />
                      <span className="font-medium">Overlap</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
