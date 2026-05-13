'use client';

import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/lib/trpc/server';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Reservation = RouterOutputs['ical']['calendarByProperty'][number];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------- UTC date helpers ----------

function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonthsUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function endOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

function getMonthWeeks(month: Date): (Date | null)[][] {
  const start = startOfMonthUTC(month);
  const end = endOfMonthUTC(month);
  // Monday = 0 ... Sunday = 6
  const dow = (start.getUTCDay() + 6) % 7;
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(dow).fill(null);
  for (let d = new Date(start); d <= end; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
    currentWeek.push(new Date(d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  // Ensure at least 6 rows for consistent height (pad with null weeks if needed)
  while (weeks.length < 6) {
    weeks.push(Array(7).fill(null));
  }
  return weeks;
}

// ---------- color mapping ----------

const SOURCE_COLORS: Record<string, string> = {
  AIRBNB: 'bg-ok/15 text-ok border-ok/25',
  BOOKING: 'bg-info/15 text-info border-info/25',
  VRBO: 'bg-warn/15 text-warn border-warn/25',
  INTERHOME: 'bg-accent/15 text-accent border-accent/25',
  OTHER: 'bg-fg-muted/15 text-fg-muted border-fg-muted/25',
};

function sourceColor(label: string): string {
  return (SOURCE_COLORS[label] ?? SOURCE_COLORS.OTHER) as string;
}

// ---------- component ----------

export function CalendarView({ reservations, loading }: { reservations: Reservation[]; loading?: boolean }) {
  if (loading) {
    return <p className="text-fg-muted text-sm">Loading calendar…</p>;
  }

  const now = new Date();
  const months = [0, 1, 2].map((i) => addMonthsUTC(startOfMonthUTC(now), i));

  return (
    <div className="space-y-8">
      {months.map((month) => (
        <MonthView key={month.getTime()} month={month} reservations={reservations} />
      ))}
    </div>
  );
}

function MonthView({ month, reservations }: { month: Date; reservations: Reservation[] }) {
  const weeks = getMonthWeeks(month);
  const monthStart = startOfMonthUTC(month);
  const monthEnd = endOfMonthUTC(month);

  // Reservations that overlap this month at all
  const monthReservations = reservations.filter((r) => {
    const s = new Date(r.startDate);
    const e = new Date(r.endDate);
    // treat endDate as inclusive (guest stays until that day, usually checkout)
    return s <= monthEnd && e >= monthStart;
  });

  return (
    <div className="surface p-4">
      <h3 className="text-sm font-semibold tracking-tightish mb-3">
        {MONTH_NAMES[month.getUTCMonth()]} {month.getUTCFullYear()}
      </h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-[10px] font-medium text-fg-muted uppercase tracking-wider text-center py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-px">
        {weeks.map((week, wi) => {
          const weekStart = week.find((d) => d !== null);
          const weekEnd = week
            .slice()
            .reverse()
            .find((d) => d !== null);
          if (!weekStart || !weekEnd) return null;

          const overlapping = monthReservations.filter((r) => {
            const s = new Date(r.startDate);
            const e = new Date(r.endDate);
            return s <= weekEnd && e >= weekStart;
          });

          return (
            <div key={wi} className="grid grid-cols-7 gap-px relative">
              {/* Day cells */}
              {week.map((day, di) => (
                <div
                  key={di}
                  className="min-h-[64px] md:min-h-[80px] bg-bg-surface/40 border border-bg-border/60 p-1 flex flex-col"
                >
                  {day && (
                    <span className="text-[10px] md:text-xs text-fg-muted tabular-nums leading-none">
                      {day.getUTCDate()}
                    </span>
                  )}
                </div>
              ))}

              {/* Reservation bars overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-7 pt-5 px-0.5 gap-y-1">
                {overlapping.map((r) => {
                  const s = new Date(r.startDate);
                  const e = new Date(r.endDate);

                  const clampedStart = s < weekStart ? weekStart : s;
                  const clampedEnd = e > weekEnd ? weekEnd : e;

                  const startIdx = week.findIndex(
                    (d) => d && d.getTime() === clampedStart.getTime()
                  );
                  const endIdx = week.findIndex(
                    (d) => d && d.getTime() === clampedEnd.getTime()
                  );

                  if (startIdx === -1 || endIdx === -1) return null;

                  const colStart = startIdx + 1; // 1-based for grid-column
                  const colSpan = endIdx - startIdx + 1;

                  const isSuppressed = r.status === 'SUPPRESSED';

                  return (
                    <div
                      key={r.id}
                      className={[
                        'pointer-events-auto h-5 px-1 rounded-sm border text-[9px] md:text-[10px] font-medium truncate flex items-center gap-1',
                        sourceColor(r.source.label),
                        isSuppressed ? 'opacity-40 line-through decoration-fg-muted' : '',
                      ].join(' ')}
                      style={{ gridColumn: `${colStart} / span ${colSpan}` }}
                      title={`${r.summary} (${r.source.label}) ${formatDate(s)} → ${formatDate(e)}`}
                    >
                      <span className="truncate">{r.source.label}</span>
                      <span className="hidden md:inline truncate opacity-80">{r.summary}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
