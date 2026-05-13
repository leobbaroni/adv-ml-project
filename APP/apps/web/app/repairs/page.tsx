'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, Download, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';

const STATUS_FLOW: Array<'PROPOSED' | 'QUOTED' | 'APPROVED' | 'COMPLETED'> = [
  'PROPOSED',
  'QUOTED',
  'APPROVED',
  'COMPLETED',
];

type RepairCategory = 'MATERIALS' | 'LABOR' | 'OTHER';

export default function RepairsPage() {
  const utils = trpc.useUtils();
  const list = trpc.repair.list.useQuery();
  const properties = trpc.property.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    propertyId: '',
    description: '',
    lineItems: [{ name: '', cost: '', category: 'MATERIALS' as RepairCategory }],
  });

  const create = trpc.repair.create.useMutation({
    onSuccess: async () => {
      await utils.repair.list.invalidate();
      setForm({ propertyId: '', description: '', lineItems: [{ name: '', cost: '', category: 'MATERIALS' }] });
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
    if (!form.propertyId || !form.description.trim()) return;
    const lineItems = form.lineItems
      .filter((li) => li.name.trim() && li.cost.trim())
      .map((li) => ({
        name: li.name.trim(),
        cost: parseFloat(li.cost),
        category: li.category,
      }));
    if (lineItems.length === 0) return;
    create.mutate({
      propertyId: form.propertyId,
      description: form.description.trim(),
      lineItems,
    });
  }

  function addLineItem() {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { name: '', cost: '', category: 'MATERIALS' }],
    }));
  }

  function updateLineItem(index: number, field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li, i) => (i === index ? { ...li, [field]: value } : li)),
    }));
  }

  function removeLineItem(index: number) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
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
          <h1 className="text-3xl font-semibold tracking-tightish">Repairs</h1>
          <p className="text-fg-muted mt-1 text-sm">
            Repair estimates and budgets by property.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 transition-colors"
          >
            <Plus size={16} /> New estimate
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
            <label className="block">
              <span className="block text-xs font-medium text-fg-muted mb-1.5">Description</span>
              <input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Bathroom door repair"
              />
            </label>
          </div>

          <div className="space-y-3">
            <span className="block text-xs font-medium text-fg-muted">Line Items</span>
            {form.lineItems.map((li, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={li.name}
                  onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                  className={inputClass}
                  placeholder="Item name"
                />
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={li.cost}
                  onChange={(e) => updateLineItem(index, 'cost', e.target.value)}
                  className={`${inputClass} w-32`}
                  placeholder="Cost"
                />
                <select
                  value={li.category}
                  onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                  className={`${inputClass} w-36`}
                >
                  <option value="MATERIALS">Materials</option>
                  <option value="LABOR">Labor</option>
                  <option value="OTHER">Other</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-btn bg-danger text-white hover:bg-danger/90 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              <Plus size={14} /> Add line item
            </button>
          </div>

          {create.error && <p className="text-sm text-danger">{create.error.message}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center justify-center h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {create.isPending ? 'Saving…' : 'Create estimate'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ propertyId: '', description: '', lineItems: [{ name: '', cost: '', category: 'MATERIALS' }] });
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
          <p className="text-fg-muted">No repair estimates yet. Create one above.</p>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([propertyName, items]) => (
            <PropertyCard key={propertyName} propertyName={propertyName} items={items} />
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
    description: string;
    lineItems: Array<{ name: string; cost: number; category: RepairCategory }>;
    status: 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'COMPLETED';
    source: string;
  }>;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold tracking-tightish">{propertyName}</h2>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <EstimateCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function EstimateCard({
  item,
}: {
  item: {
    id: string;
    propertyId: string;
    description: string;
    lineItems: Array<{ name: string; cost: number; category: RepairCategory }>;
    status: 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'COMPLETED';
    source: string;
  };
}) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState(item.lineItems);

  const update = trpc.repair.update.useMutation({
    onSuccess: () => {
      utils.repair.list.invalidate();
      setEditing(false);
    },
  });

  const del = trpc.repair.delete.useMutation({
    onSuccess: () => utils.repair.list.invalidate(),
  });

  const total = item.lineItems.reduce((sum, li) => sum + li.cost, 0);

  function handleSave() {
    const validItems = editItems
      .filter((li) => li.name.trim() && li.cost > 0)
      .map((li) => ({
        name: li.name.trim(),
        cost: typeof li.cost === 'string' ? parseFloat(li.cost) : li.cost,
        category: li.category,
      }));
    update.mutate({ id: item.id, lineItems: validItems });
  }

  return (
    <div className="border border-bg-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-medium">{item.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={item.status} />
            <span className="text-xs text-fg-muted">{item.source}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/repair/pdf?repairId=${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-btn border border-bg-border text-xs text-fg hover:bg-bg-surface transition-colors"
          >
            <Download size={12} /> PDF
          </a>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center h-8 px-2.5 rounded-btn border border-bg-border text-xs text-fg hover:bg-bg-surface transition-colors"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this estimate?')) del.mutate({ id: item.id });
            }}
            disabled={del.isPending}
            className="inline-flex items-center justify-center h-8 w-8 rounded-btn bg-danger text-white hover:bg-danger/90 disabled:opacity-60 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2 mb-3">
          {editItems.map((li, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={li.name}
                onChange={(e) =>
                  setEditItems((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, name: e.target.value } : p)),
                  )
                }
                className="flex-1 h-8 px-2 text-xs rounded bg-bg border border-bg-border focus:border-accent"
              />
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={li.cost}
                onChange={(e) =>
                  setEditItems((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, cost: parseFloat(e.target.value) || 0 } : p)),
                  )
                }
                className="w-24 h-8 px-2 text-xs rounded bg-bg border border-bg-border focus:border-accent"
              />
              <select
                value={li.category}
                onChange={(e) =>
                  setEditItems((prev) =>
                    prev.map((p, i) => (i === index ? { ...p, category: e.target.value as RepairCategory } : p)),
                  )
                }
                className="w-28 h-8 px-2 text-xs rounded bg-bg border border-bg-border focus:border-accent"
              >
                <option value="MATERIALS">Materials</option>
                <option value="LABOR">Labor</option>
                <option value="OTHER">Other</option>
              </select>
              <button
                type="button"
                onClick={() => setEditItems((prev) => prev.filter((_, i) => i !== index))}
                className="inline-flex items-center justify-center h-8 w-8 rounded bg-danger text-white hover:bg-danger/90"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setEditItems((prev) => [...prev, { name: '', cost: 0, category: 'MATERIALS' }])}
            className="text-xs text-accent hover:underline"
          >
            + Add line item
          </button>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={update.isPending}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-btn bg-accent text-bg text-xs font-medium hover:bg-amber-400 disabled:opacity-60 transition-colors"
            >
              <Check size={12} /> Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditItems(item.lineItems);
              }}
              className="inline-flex items-center h-8 px-3 rounded-btn border border-bg-border text-xs text-fg hover:bg-bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left text-xs text-fg-muted">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {item.lineItems.map((li, i) => (
                <tr key={i} className="border-b border-bg-border last:border-0">
                  <td className="py-2">{li.name}</td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center h-5 px-1.5 rounded-sm text-[10px] font-medium ${
                        li.category === 'MATERIALS'
                          ? 'bg-blue-100 text-blue-700'
                          : li.category === 'LABOR'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {li.category}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums">€{li.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-bg-border">
        <p className="text-sm font-medium">Total: €{total.toFixed(2)}</p>
        <StatusToggle id={item.id} status={item.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PROPOSED: 'bg-amber-100 text-amber-700',
    QUOTED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded-sm text-[10px] font-medium ${colors[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

function StatusToggle({
  id,
  status,
}: {
  id: string;
  status: 'PROPOSED' | 'QUOTED' | 'APPROVED' | 'COMPLETED';
}) {
  const utils = trpc.useUtils();
  const update = trpc.repair.updateStatus.useMutation({
    onSuccess: () => utils.repair.list.invalidate(),
  });

  const currentIndex = STATUS_FLOW.indexOf(status);
  const nextStatus = STATUS_FLOW[currentIndex + 1];

  return (
    <div className="flex items-center gap-2">
      {nextStatus && (
        <button
          type="button"
          onClick={() => update.mutate({ id, status: nextStatus })}
          disabled={update.isPending}
          className="inline-flex items-center h-8 px-2.5 rounded-btn border border-bg-border text-xs text-fg hover:bg-bg-surface disabled:opacity-60 transition-colors"
        >
          Mark {nextStatus}
        </button>
      )}
    </div>
  );
}

const inputClass =
  'w-full h-10 px-3 rounded-btn bg-bg border border-bg-border text-fg placeholder:text-fg-muted/60 focus:border-accent transition-colors';
