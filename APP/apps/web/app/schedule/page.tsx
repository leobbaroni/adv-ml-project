'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { WindowPicker } from '@/components/WindowPicker';
import { ScheduleTable } from '@/components/ScheduleTable';

function formatISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function endOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SchedulePage() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [referenceDate, setReferenceDate] = useState<Date>(today);
  const [windowDays, setWindowDays] = useState<number>(
    daysBetween(today, endOfMonthUTC(today)),
  );

  const handleWindowChange = useCallback((newRef: Date, newDays: number) => {
    setReferenceDate(newRef);
    setWindowDays(newDays);
  }, []);

  const schedule = trpc.schedule.list.useQuery({ referenceDate, windowDays });

  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('referenceDate', formatISODate(referenceDate));
    params.set('windowDays', String(windowDays));
    return `/api/schedule/pdf?${params.toString()}`;
  }, [referenceDate, windowDays]);

  return (
    <main className="min-h-screen px-6 md:px-12 py-12 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <ChevronLeft size={14} /> Home
        </Link>
      </div>

      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tightish">Schedule</h1>
          <p className="text-fg-muted mt-1 text-sm">
            Printable turnover schedule for your portfolio.
          </p>
        </div>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
        >
          <Download size={16} /> Download PDF
        </a>
      </header>

      <div className="mb-6">
        <WindowPicker
          referenceDate={referenceDate}
          windowDays={windowDays}
          onChange={handleWindowChange}
        />
      </div>

      {schedule.error && (
        <p className="text-sm text-danger mb-4">{schedule.error.message}</p>
      )}

      <ScheduleTable rows={schedule.data ?? []} loading={schedule.isLoading} />
    </main>
  );
}
