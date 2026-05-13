'use client';

import { useState } from 'react';

interface WindowPickerProps {
  referenceDate: Date;
  windowDays: number;
  onChange: (referenceDate: Date, windowDays: number) => void;
}

type Preset = 'this-month' | 'next-month' | 'custom';

function endOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function addMonthsUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatInputDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseInputDate(s: string): Date {
  const parts = s.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(Date.UTC(y, m - 1, d));
}

function getPreset(referenceDate: Date, windowDays: number): Preset {
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
  const activePreset = getPreset(referenceDate, windowDays);

  const [customFrom, setCustomFrom] = useState(formatInputDate(referenceDate));
  const [customTo, setCustomTo] = useState(
    formatInputDate(new Date(referenceDate.getTime() + windowDays * 24 * 60 * 60 * 1000)),
  );

  const applyThisMonth = () => {
    const end = endOfMonthUTC(today);
    onChange(today, daysBetween(today, end));
  };

  const applyNextMonth = () => {
    const start = addMonthsUTC(today, 1);
    const end = endOfMonthUTC(start);
    onChange(start, daysBetween(start, end));
  };

  const applyCustom = () => {
    const from = parseInputDate(customFrom);
    const to = parseInputDate(customTo);
    if (to.getTime() < from.getTime()) return;
    onChange(from, daysBetween(from, to));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <PresetButton
          label="This Month"
          isActive={activePreset === 'this-month'}
          onClick={applyThisMonth}
        />
        <PresetButton
          label="Next Month"
          isActive={activePreset === 'next-month'}
          onClick={applyNextMonth}
        />
        <PresetButton
          label="Set Window"
          isActive={activePreset === 'custom'}
          onClick={applyCustom}
        />
      </div>

      {activePreset === 'custom' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-fg-muted">From</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                const from = parseInputDate(e.target.value);
                const to = parseInputDate(customTo);
                if (to.getTime() >= from.getTime()) {
                  onChange(from, daysBetween(from, to));
                }
              }}
              className="h-8 px-2 rounded-btn bg-bg border border-bg-border text-sm text-fg"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-fg-muted">To</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                const from = parseInputDate(customFrom);
                const to = parseInputDate(e.target.value);
                if (to.getTime() >= from.getTime()) {
                  onChange(from, daysBetween(from, to));
                }
              }}
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
