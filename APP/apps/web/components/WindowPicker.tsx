'use client';

interface WindowPickerProps {
  activeDays: number;
  onChange: (days: number) => void;
}

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: '+30 days', days: 30 },
  { label: '+60 days', days: 60 },
  { label: '+90 days', days: 90 },
];

export function WindowPicker({ activeDays, onChange }: WindowPickerProps) {
  return (
    <div className="flex items-center gap-2">
      {PRESETS.map((preset) => {
        const isActive = activeDays === preset.days;
        return (
          <button
            key={preset.days}
            type="button"
            onClick={() => onChange(preset.days)}
            className={[
              'inline-flex items-center justify-center h-9 px-4 rounded-btn text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-bg'
                : 'border border-bg-border text-fg hover:bg-bg-surface',
            ].join(' ')}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
