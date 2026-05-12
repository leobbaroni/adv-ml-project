'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import { PropertyCreateSchema, type PropertyCreateInput } from '@app/shared';
import { trpc } from '@/lib/trpc/react';

type FormErrors = Partial<Record<keyof PropertyCreateInput, string>>;

const EMPTY_FORM: PropertyCreateInput = {
  name: '',
  address: '',
  city: '',
  country: '',
  ownerName: '',
  ownerContact: '',
  notes: '',
};

export default function PropertiesPage() {
  const utils = trpc.useUtils();
  const list = trpc.property.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PropertyCreateInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const create = trpc.property.create.useMutation({
    onSuccess: async () => {
      await utils.property.list.invalidate();
      setForm(EMPTY_FORM);
      setErrors({});
      setShowForm(false);
    },
  });

  function update<K extends keyof PropertyCreateInput>(key: K, value: PropertyCreateInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Empty optional strings -> undefined so zod .optional() passes cleanly.
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
    create.mutate(parsed.data);
  }

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
          <h1 className="text-3xl font-semibold tracking-tightish">Properties</h1>
          <p className="text-fg-muted mt-1 text-sm">
            Manage your rental portfolio and connect iCal feeds.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 transition-colors"
          >
            <Plus size={16} /> New property
          </button>
        )}
      </header>

      {showForm && (
        <form onSubmit={onSubmit} className="surface p-5 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Name" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={inputClass}
                placeholder="Casa del Mar"
              />
            </FormField>
            <FormField label="Address" error={errors.address}>
              <input
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className={inputClass}
                placeholder="Carrer de la Marina 12"
              />
            </FormField>
            <FormField label="City" error={errors.city}>
              <input
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className={inputClass}
                placeholder="Barcelona"
              />
            </FormField>
            <FormField label="Country" error={errors.country}>
              <input
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                className={inputClass}
                placeholder="Spain"
              />
            </FormField>
            <FormField label="Owner name (optional)" error={errors.ownerName}>
              <input
                value={form.ownerName ?? ''}
                onChange={(e) => update('ownerName', e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Owner contact (optional)" error={errors.ownerContact}>
              <input
                value={form.ownerContact ?? ''}
                onChange={(e) => update('ownerContact', e.target.value)}
                className={inputClass}
                placeholder="email or phone"
              />
            </FormField>
          </div>
          <FormField label="Notes (optional)" error={errors.notes}>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => update('notes', e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
            />
          </FormField>

          {create.error && (
            <p className="text-sm text-danger">{create.error.message}</p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center justify-center h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {create.isPending ? 'Saving…' : 'Create property'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
              className="inline-flex items-center justify-center h-10 px-4 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {list.isLoading && <p className="text-fg-muted text-sm">Loading…</p>}

      {list.error && (
        <p className="text-sm text-danger">{list.error.message}</p>
      )}

      {list.data && list.data.length === 0 && !showForm && (
        <div className="surface p-12 text-center">
          <p className="text-fg-muted">No properties yet. Create one above.</p>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <ul className="space-y-3">
          {list.data.map((p) => (
            <li key={p.id}>
              <Link
                href={`/properties/${p.id}`}
                className="surface block p-5 hover:border-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tightish truncate">
                      {p.name}
                    </h2>
                    <p className="text-sm text-fg-muted mt-0.5">
                      {p.city}, {p.country}
                    </p>
                  </div>
                  <p className="text-xs text-fg-muted tabular-nums whitespace-nowrap pt-1">
                    {p._count.icalSources} sources · {p._count.reservations} reservations
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

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
