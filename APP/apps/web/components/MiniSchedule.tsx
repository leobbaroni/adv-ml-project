'use client';

import { AlertTriangle } from 'lucide-react';

interface MiniScheduleReservation {
  summary: string;
  startDate: Date;
  endDate: Date;
}

interface MiniScheduleProps {
  current: MiniScheduleReservation | null;
  next: MiniScheduleReservation | null;
  hasOverlap: boolean;
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
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function MiniSchedule({ current, next, hasOverlap, loading }: MiniScheduleProps) {
  if (loading) {
    return (
      <div className="surface p-4">
        <p className="text-fg-muted text-sm">Loading schedule…</p>
      </div>
    );
  }

  const turnover =
    current && next ? daysBetween(current.endDate, next.startDate) : null;

  const turnoverDisplay =
    turnover === null || turnover === 0 ? '—' : `${turnover}d`;

  const turnoverClass =
    turnover === null || turnover === 0
      ? 'text-fg-muted'
      : turnover > 0
        ? 'text-ok'
        : 'text-danger';

  return (
    <div className="surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tightish">Schedule</h3>
        {hasOverlap && (
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-danger/30 bg-danger/10 text-danger text-[10px] font-medium tracking-wider">
            <AlertTriangle size={12} />
            Overlap
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Current guest</span>
          <span className="text-fg truncate ml-4">
            {current ? current.summary : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Check-out</span>
          <span className="text-fg tabular-nums">
            {formatDate(current?.endDate)}
          </span>
        </div>

        <div className="h-px bg-bg-border" />

        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Next guest</span>
          <span className="text-fg truncate ml-4">
            {next ? next.summary : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Check-in</span>
          <span className="text-fg tabular-nums">
            {formatDate(next?.startDate)}
          </span>
        </div>

        <div className="h-px bg-bg-border" />

        <div className="flex items-center justify-between text-sm">
          <span className="text-fg-muted">Turnover</span>
          <span className={['font-medium tabular-nums', turnoverClass].join(' ')}>
            {turnoverDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
