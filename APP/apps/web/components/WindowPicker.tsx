'use client';

import { useState, useEffect } from 'react';

interface WindowPickerProps {
  referenceDate: Date;
  windowDays: number;
  onChange: (referenceDate: Date, windowDays: number) => void;
}

type Mode = 'this-month' | 'next-month' | 'custom';

function endOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function addMonthsUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function fmt(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parse(s: string): Date {
  const parts = s.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(Date.UTC(y, m - 1, d));
}

function detectMode(referenceDate: Date, windowDays: number): Mode {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const thisMonthEnd = endOfMonthUTC(today);
  const nextMonthStart = addMonthsUTC(today, 1);
  const nextMonthEnd = endOfMonthUTC(nextMonthStart);

  const isThisMonth =
    referenceDate.getTime() === today.getTime() &&
    windowDays === daysBetween(today, thisMonthEnd);

  const isNextMonth =
    referenceDate.getTime() === nextMonthStart.getTime() &&
    windowDays === daysBetween(nextMonthStart, nextMonthEnd);

  if (isThisMonth) return 'this-month';
  if (isNextMonth) return 'next-month';
  return 'custom';
}

export function WindowPicker({ referenceDate, windowDays, onChange }: WindowPickerProps) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const [mode, setMode] = useState<Mode>(() => detectMode(referenceDate, windowDays));

  // Inputs for custom mode — keep in sync with props whenever we enter custom
  const [customFrom, setCustomFrom] = useState(fmt(referenceDate));
  const [customTo, setCustomTo] = useState(
    fmt(new Date(referenceDate.getTime() + windowDays * 24 * 60 * 60 * 1000)),
  );

  useEffect(() => {
    if (mode === 'custom') {
      setCustomFrom(fmt(referenceDate));
      setCustomTo(fmt(new Date(referenceDate.getTime() + windowDays * 24 * 60 * 60 * 1000)));
    }
  }, [mode, referenceDate, windowDays]);

  const applyThisMonth = () => {
    setMode('this-month');
    const end = endOfMonthUTC(today);
    onChange(today, daysBetween(today, end));
  };

  const applyNextMonth = () => {
    setMode('next-month');
    const start = addMonthsUTC(today, 1);
    const end = endOfMonthUTC(start);
    onChange(start, daysBetween(start, end));
  };

  const switchToCustom = () => {
    setMode('custom');
    const from = parse(customFrom);
    const to = parse(customTo);
    onChange(from, daysBetween(from, to));
  };

  const updateFrom = (val: string) => {
    setCustomFrom(val);
    const from = parse(val);
    const to = parse(customTo);
    onChange(from, daysBetween(from, to));
  };

  const updateTo = (val: string) => {
    setCustomTo(val);
    const from = parse(customFrom);
    const to = parse(val);
    onChange(from, daysBetween(from, to));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <PresetButton
          label="This Month"
          isActive={mode === 'this-month'}
          onClick={applyThisMonth}
        />
        <PresetButton
          label="Next Month"
          isActive={mode === 'next-month'}
          onClick={applyNextMonth}
        />
        <PresetButton
          label="Set Window"
          isActive={mode === 'custom'}
          onClick={switchToCustom}
        />
      </div>

      {mode === 'custom' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-fg-muted">From</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => updateFrom(e.target.value)}
              className="h-8 px-2 rounded-btn bg-bg border border-bg-border text-sm text-fg"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-fg-muted">To</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => updateTo(e.target.value)}
              className="h-8 px-2 rounded-btn bg-bg border border-bg-border text-sm text-fg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PresetButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center h-9 px-4 rounded-btn text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-bg'
          : 'border border-bg-border text-fg hover:bg-bg-surface',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
