'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Download, ExternalLink, RefreshCw, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';

export default function OrdersPage() {
  const utils = trpc.useUtils();
  const list = trpc.shopping.list.useQuery();
  const properties = trpc.property.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    propertyId: '',
    name: '',
    qty: '1',
    unitPrice: '',
    ikeaUrl: '',
  });

  const create = trpc.shopping.create.useMutation({
    onSuccess: async () => {
      await utils.shopping.list.invalidate();
      setForm({ propertyId: '', name: '', qty: '1', unitPrice: '', ikeaUrl: '' });
      setShowForm(false);
    },
  });

  const grouped = new Map<string, NonNullable<typeof list.data>[number][]>();
  if (list.data) {
    for (const item of list.data) {
      const key = item.property.name;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.propertyId || !form.name.trim()) return;
    create.mutate({
      propertyId: form.propertyId,
      name: form.name.trim(),
      qty: parseInt(form.qty, 10) || 1,
      unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
      ikeaUrl: form.ikeaUrl?.trim() ? form.ikeaUrl.trim() : undefined,
    });
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
          <h1 className="text-3xl font-semibold tracking-tightish">Orders</h1>
          <p className="text-fg-muted mt-1 text-sm">
            Shopping list and invoice view by property.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 transition-colors"
          >
            <Plus size={16} /> New item
          </button>
        )}
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="surface p-5 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-medium text-fg-muted mb-1.5">Property</span>
              <select
                value={form.propertyId}
                onChange={(e) => setForm((prev) => ({ ...prev, propertyId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select property</option>
                {properties.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <FormField label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. BILLY bookcase"
              />
            </FormField>
            <FormField label="Quantity">
              <input
                type="number"
                min={1}
                value={form.qty}
                onChange={(e) => setForm((prev) => ({ ...prev, qty: e.target.value }))}
                className={inputClass}
              />
            </FormField>
            <FormField label="Unit Price (optional)">
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
                className={inputClass}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="IKEA URL (optional)">
              <input
                type="url"
                value={form.ikeaUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, ikeaUrl: e.target.value }))}
                className={inputClass}
                placeholder="https://www.ikea.com/..."
              />
            </FormField>
          </div>

          {create.error && <p className="text-sm text-danger">{create.error.message}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center justify-center h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {create.isPending ? 'Saving…' : 'Create item'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ propertyId: '', name: '', qty: '1', unitPrice: '', ikeaUrl: '' });
              }}
              className="inline-flex items-center justify-center h-10 px-4 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {list.isLoading && <p className="text-fg-muted text-sm">Loading…</p>}
      {list.error && <p className="text-sm text-danger">{list.error.message}</p>}

      {list.data && list.data.length === 0 && !showForm && (
        <div className="surface p-12 text-center">
          <p className="text-fg-muted">No shopping items yet. Create one above.</p>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([propertyName, items]) => (
            <PropertyCard
              key={propertyName}
              propertyName={propertyName}
              items={items}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function PropertyCard({
  propertyName,
  items,
}: {
  propertyName: string;
  items: Array<{
    id: string;
    propertyId: string;
    name: string;
    qty: number;
    unitPrice: number | null;
    status: 'PROPOSED' | 'ORDERED';
    source: string;
    ikeaUrl: string | null;
  }>;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold tracking-tightish">{propertyName}</h2>
        <a
          href={`/api/invoice/pdf?propertyId=${items[0]!.propertyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
        >
          <Download size={14} /> Download Invoice PDF
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bg-border text-left text-xs text-fg-muted">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Unit Price</th>
              <th className="pb-2 font-medium">Total</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Source</th>
              <th className="pb-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemRow({
  item,
}: {
  item: {
    id: string;
    propertyId: string;
    name: string;
    qty: number;
    unitPrice: number | null;
    status: 'PROPOSED' | 'ORDERED';
    source: string;
    ikeaUrl: string | null;
  };
}) {
  const utils = trpc.useUtils();
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlValue, setUrlValue] = useState(item.ikeaUrl ?? '');
  const [fetching, setFetching] = useState(false);

  const update = trpc.shopping.update.useMutation({
    onSuccess: () => {
      utils.shopping.list.invalidate();
      setEditingUrl(false);
      setFetching(false);
    },
    onError: () => setFetching(false),
  });

  const fetchPrice = trpc.shopping.fetchIkeaPrice.useMutation({
    onSuccess: (data) => {
      if (data.price != null) {
        update.mutate({ id: item.id, unitPrice: data.price });
      } else {
        setFetching(false);
      }
    },
    onError: () => setFetching(false),
  });

  function handleSaveUrl() {
    const trimmed = urlValue.trim();
    if (!trimmed) {
      update.mutate({ id: item.id, ikeaUrl: undefined });
      return;
    }
    setFetching(true);
    update.mutate(
      { id: item.id, ikeaUrl: trimmed },
      {
        onSuccess: () => {
          fetchPrice.mutate({ url: trimmed });
        },
        onError: () => setFetching(false),
      },
    );
  }

  return (
    <tr className="border-b border-bg-border last:border-0">
      <td className="py-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{item.name}</span>
          {item.status === 'PROPOSED' && (
            <div className="flex items-center gap-2">
              {editingUrl ? (
                <div className="flex items-center gap-1">
                  <input
                    type="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    className="h-7 px-2 text-xs rounded bg-bg border border-bg-border focus:border-accent w-48"
                    placeholder="https://www.ikea.com/..."
                    disabled={fetching}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUrl();
                      if (e.key === 'Escape') {
                        setEditingUrl(false);
                        setUrlValue(item.ikeaUrl ?? '');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    disabled={fetching}
                    className="inline-flex items-center justify-center h-7 w-7 rounded bg-accent text-bg hover:bg-amber-400 disabled:opacity-60"
                    title="Save & fetch price"
                  >
                    {fetching ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                  </button>
                </div>
              ) : item.ikeaUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={item.ikeaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <ExternalLink size={10} /> IKEA link
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditingUrl(true)}
                    className="text-xs text-fg-muted hover:text-fg"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingUrl(true)}
                  className="text-xs text-fg-muted hover:text-accent"
                >
                  + Add IKEA link
                </button>
              )}
            </div>
          )}
          {item.status === 'ORDERED' && item.ikeaUrl && (
            <a
              href={item.ikeaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <ExternalLink size={10} /> IKEA link
            </a>
          )}
        </div>
      </td>
      <td className="py-3 tabular-nums">{item.qty}</td>
      <td className="py-3 tabular-nums">
        {item.unitPrice != null ? `€${item.unitPrice.toFixed(2)}` : '—'}
      </td>
      <td className="py-3 tabular-nums">
        {item.unitPrice != null
          ? `€${(item.qty * item.unitPrice).toFixed(2)}`
          : '—'}
      </td>
      <td className="py-3">
        <span
          className={`inline-flex items-center h-5 px-1.5 rounded-sm text-[10px] font-medium ${
            item.status === 'ORDERED'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {item.status}
        </span>
      </td>
      <td className="py-3 text-fg-muted">{item.source}</td>
      <td className="py-3 text-right">
        <div className="inline-flex items-center gap-2">
          <StatusToggle id={item.id} status={item.status} />
          <DeleteButton id={item.id} />
        </div>
      </td>
    </tr>
  );
}

function StatusToggle({
  id,
  status,
}: {
  id: string;
  status: 'PROPOSED' | 'ORDERED';
}) {
  const utils = trpc.useUtils();
  const update = trpc.shopping.updateStatus.useMutation({
    onSuccess: () => utils.shopping.list.invalidate(),
  });

  return (
    <button
      type="button"
      onClick={() =>
        update.mutate({ id, status: status === 'PROPOSED' ? 'ORDERED' : 'PROPOSED' })
      }
      disabled={update.isPending}
      className="inline-flex items-center h-8 px-2.5 rounded-btn border border-bg-border text-xs text-fg hover:bg-bg-surface disabled:opacity-60 transition-colors"
    >
      {status === 'PROPOSED' ? 'Accept' : 'Reorder'}
    </button>
  );
}

function DeleteButton({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const del = trpc.shopping.delete.useMutation({
    onSuccess: () => utils.shopping.list.invalidate(),
  });

  return (
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete this item?')) del.mutate({ id });
          }}
          disabled={del.isPending}
          className="inline-flex items-center justify-center h-8 w-8 rounded-btn bg-danger text-white hover:bg-danger/90 disabled:opacity-60 transition-colors"
        >
          <Trash2 size={14} />
        </button>
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
