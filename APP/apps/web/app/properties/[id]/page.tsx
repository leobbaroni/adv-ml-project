'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { inferRouterOutputs } from '@trpc/server';
import {
  ICalLabelEnum,
  ICalSourceCreateSchema,
  PropertyCreateSchema,
  type ICalLabel,
  type PropertyCreateInput,
} from '@app/shared';
import { trpc } from '@/lib/trpc/react';
import type { AppRouter } from '@/lib/trpc/server';
import { CalendarView } from '@/components/CalendarView';
import { MiniSchedule } from '@/components/MiniSchedule';
import { PendingOverlaps } from '@/components/PendingOverlaps';
import { AuditLog } from '@/components/AuditLog';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type PropertyFromQuery = RouterOutputs['property']['byId'];

type FormErrors = Partial<Record<keyof PropertyCreateInput, string>>;
type SourceFormErrors = Partial<{ label: string; url: string }>;

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const utils = trpc.useUtils();

  const property = trpc.property.byId.useQuery({ id }, { retry: false });
  const calendar = trpc.ical.calendarByProperty.useQuery({ propertyId: id });
  const overlaps = trpc.ical.pendingOverlapsByProperty.useQuery({ propertyId: id });
  const schedule = trpc.schedule.byProperty.useQuery({ propertyId: id });

  const [editing, setEditing] = useState(false);

  if (property.isLoading) {
    return (
      <Shell>
        <p className="text-fg-muted text-sm">Loading…</p>
      </Shell>
    );
  }

  if (property.error || !property.data) {
    return (
      <Shell>
        <div className="surface p-8 text-center">
          <p className="text-fg-muted">
            {property.error?.data?.code === 'NOT_FOUND'
              ? 'Property not found.'
              : (property.error?.message ?? 'Property not found.')}
          </p>
        </div>
      </Shell>
    );
  }

  const p = property.data;

  return (
    <Shell>
      {editing ? (
        <EditForm
          property={p}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            await utils.property.byId.invalidate({ id });
            await utils.property.list.invalidate();
            setEditing(false);
          }}
        />
      ) : (
        <Header
          property={p}
          onEdit={() => setEditing(true)}
          onDeleted={() => {
            // Invalidate list so it refetches when user lands back on /properties.
            void utils.property.list.invalidate();
            router.push('/properties');
          }}
        />
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tightish mb-3">iCal sources</h2>
        <SourcesList
          sources={p.icalSources}
          propertyId={id}
          onChanged={() => utils.property.byId.invalidate({ id })}
        />
        <AddSourceForm
          propertyId={id}
          onAdded={() => utils.property.byId.invalidate({ id })}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tightish mb-3">Calendar</h2>
        <CalendarView reservations={calendar.data ?? []} loading={calendar.isLoading} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tightish mb-3">Schedule</h2>
        <MiniSchedule
          reservations={schedule.data ?? []}
          loading={schedule.isLoading}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tightish mb-3">Pending overlaps</h2>
        <PendingOverlaps
          overlaps={overlaps.data ?? []}
          reservations={calendar.data ?? []}
          propertyId={id}
          loading={overlaps.isLoading}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tightish mb-3">Audit log</h2>
        <AuditLog propertyId={id} />
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-6 md:px-12 py-12 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <ChevronLeft size={14} /> Back to properties
        </Link>
      </div>
      {children}
    </main>
  );
}

function Header({
  property,
  onEdit,
  onDeleted,
}: {
  property: PropertyFromQuery;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const del = trpc.property.delete.useMutation({
    onSuccess: onDeleted,
  });

  function confirmDelete() {
    const ok = window.confirm(
      `Delete "${property.name}"? This will also remove its iCal sources and reservations. This cannot be undone.`,
    );
    if (ok) del.mutate({ id: property.id });
  }

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tightish truncate">{property.name}</h1>
        <p className="text-fg-muted mt-1 text-sm">
          {property.city}, {property.country}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center h-10 px-4 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={confirmDelete}
          disabled={del.isPending}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-60 transition-colors"
        >
          <Trash2 size={14} /> {del.isPending ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </header>
  );
}

function EditForm({
  property,
  onCancel,
  onSaved,
}: {
  property: PropertyFromQuery;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PropertyCreateInput>({
    name: property.name,
    address: property.address,
    city: property.city,
    country: property.country,
    ownerName: property.ownerName ?? '',
    ownerContact: property.ownerContact ?? '',
    notes: property.notes ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const update = trpc.property.update.useMutation({
    onSuccess: onSaved,
  });

  function set<K extends keyof PropertyCreateInput>(key: K, value: PropertyCreateInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const candidate: PropertyCreateInput = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      ownerName: form.ownerName?.trim() ? form.ownerName.trim() : undefined,
      ownerContact: form.ownerContact?.trim() ? form.ownerContact.trim() : undefined,
      notes: form.notes?.trim() ? form.notes.trim() : undefined,
    };
    const parsed = PropertyCreateSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !(key in fieldErrors)) {
          fieldErrors[key as keyof PropertyCreateInput] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    update.mutate({ id: property.id, ...parsed.data });
  }

  return (
    <form onSubmit={onSubmit} className="surface p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" error={errors.name}>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Address" error={errors.address}>
          <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="City" error={errors.city}>
          <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Country" error={errors.country}>
          <input value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Owner name (optional)" error={errors.ownerName}>
          <input value={form.ownerName ?? ''} onChange={(e) => set('ownerName', e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Owner contact (optional)" error={errors.ownerContact}>
          <input value={form.ownerContact ?? ''} onChange={(e) => set('ownerContact', e.target.value)} className={inputClass} />
        </FormField>
      </div>
      <FormField label="Notes (optional)" error={errors.notes}>
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          className={`${inputClass} min-h-[80px] resize-y`}
        />
      </FormField>

      {update.error && <p className="text-sm text-danger">{update.error.message}</p>}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={update.isPending}
          className="inline-flex items-center justify-center h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 disabled:opacity-60 transition-colors"
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center h-10 px-4 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function SourcesList({
  sources,
  propertyId,
  onChanged,
}: {
  sources: PropertyFromQuery['icalSources'];
  propertyId: string;
  onChanged: () => Promise<unknown> | unknown;
}) {
  const fetchAll = trpc.ical.fetchAll.useMutation({
    onSuccess: () => {
      void onChanged();
    },
  });

  if (sources.length === 0) {
    return (
      <div className="surface p-6 text-center mb-3">
        <p className="text-fg-muted text-sm">No iCal sources yet. Add one below.</p>
      </div>
    );
  }
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-fg-muted">{sources.length} source(s)</p>
        <button
          type="button"
          onClick={() => fetchAll.mutate({ propertyId })}
          disabled={fetchAll.isPending}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-btn border border-bg-border text-fg hover:bg-bg transition-colors disabled:opacity-60"
        >
          <RefreshCw size={14} className={fetchAll.isPending ? 'animate-spin' : ''} />
          <span className="text-sm">Fetch all</span>
        </button>
      </div>
      <ul className="space-y-2">
        {sources.map((s) => (
          <SourceRow key={s.id} source={s} onChanged={onChanged} />
        ))}
      </ul>
    </div>
  );
}

function SourceRow({
  source,
  onChanged,
}: {
  source: PropertyFromQuery['icalSources'][number];
  onChanged: () => Promise<unknown> | unknown;
}) {
  const del = trpc.icalSource.delete.useMutation({
    onSuccess: () => {
      void onChanged();
    },
  });

  function confirmDelete() {
    const ok = window.confirm(`Delete this ${source.label} source? Existing reservations from it will also be removed.`);
    if (ok) del.mutate({ id: source.id });
  }

  return (
    <li className="surface p-4 flex items-start gap-4">
      <LabelBadge label={source.label} />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm text-fg truncate font-mono"
          title={source.url}
        >
          {source.url}
        </p>
        <p className="text-xs text-fg-muted mt-1 tabular-nums">
          Last fetched: {formatRelative(source.lastFetchedAt)}
        </p>
        {source.lastError && (
          <p className="text-xs text-danger mt-1 break-words">{source.lastError}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={confirmDelete}
          disabled={del.isPending}
          className="inline-flex items-center justify-center h-9 w-9 rounded-btn border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-60 transition-colors"
          aria-label="Delete source"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function AddSourceForm({ propertyId, onAdded }: { propertyId: string; onAdded: () => Promise<unknown> | unknown }) {
  const [label, setLabel] = useState<ICalLabel>('AIRBNB');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<SourceFormErrors>({});

  const create = trpc.icalSource.create.useMutation({
    onSuccess: async () => {
      setUrl('');
      setLabel('AIRBNB');
      setErrors({});
      await onAdded();
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = ICalSourceCreateSchema.safeParse({ propertyId, label, url: url.trim() });
    if (!parsed.success) {
      const fieldErrors: SourceFormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === 'label' || key === 'url') && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    create.mutate(parsed.data);
  }

  return (
    <form onSubmit={onSubmit} className="surface p-4 flex flex-col md:flex-row gap-3 md:items-end">
      <div className="md:w-40">
        <span className="block text-xs font-medium text-fg-muted mb-1.5">Label</span>
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value as ICalLabel)}
          className={inputClass}
        >
          {ICalLabelEnum.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors.label && <span className="block text-xs text-danger mt-1">{errors.label}</span>}
      </div>
      <div className="flex-1">
        <span className="block text-xs font-medium text-fg-muted mb-1.5">iCal URL</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.airbnb.com/calendar/ical/…"
          className={inputClass}
        />
        {errors.url && <span className="block text-xs text-danger mt-1">{errors.url}</span>}
      </div>
      <button
        type="submit"
        disabled={create.isPending}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 disabled:opacity-60 transition-colors"
      >
        <Plus size={16} /> {create.isPending ? 'Adding…' : 'Add source'}
      </button>
      {create.error && (
        <p className="text-sm text-danger md:w-full md:basis-full">{create.error.message}</p>
      )}
    </form>
  );
}

// ---------- helpers ----------

const inputClass =
  'w-full h-10 px-3 rounded-btn bg-bg border border-bg-border text-fg placeholder:text-fg-muted/60 focus:border-accent transition-colors';

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-fg-muted mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  );
}

function LabelBadge({ label }: { label: ICalLabel }) {
  return (
    <span className="inline-flex items-center h-6 px-2 rounded-full bg-bg border border-bg-border text-[10px] font-medium tracking-wider text-fg-muted">
      {label}
    </span>
  );
}

function formatRelative(d: Date | null): string {
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}
