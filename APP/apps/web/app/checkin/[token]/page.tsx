'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { CheckInFormSchema, type CheckInFormInput } from '@app/shared';

export default function GuestCheckInPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const query = trpc.checkin.byToken.useQuery({ token }, { retry: false });
  const submit = trpc.checkin.submit.useMutation({
    onSuccess: () => {
      void query.refetch();
    },
  });

  const [form, setForm] = useState<CheckInFormInput>({
    fullName: '',
    country: '',
    citizenId: '',
    dob: new Date(),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CheckInFormInput, string>>>({});

  if (query.isLoading) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-lg mx-auto">
        <p className="text-fg-muted text-sm">Loading…</p>
      </main>
    );
  }

  if (query.error) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-lg mx-auto">
        <div className="surface p-8 text-center">
          <p className="text-danger text-sm">
            {query.error.data?.code === 'FORBIDDEN'
              ? 'This link has expired. Please contact your host.'
              : 'Invalid or expired link.'}
          </p>
        </div>
      </main>
    );
  }

  const data = query.data;
  if (!data) return null;

  const property = data.reservation.property;
  const alreadySubmitted = !!data.submittedAt;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const candidate: CheckInFormInput = {
      fullName: form.fullName.trim(),
      country: form.country.trim(),
      citizenId: form.citizenId.trim(),
      dob: form.dob,
    };
    const parsed = CheckInFormSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CheckInFormInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key as keyof CheckInFormInput]) {
          fieldErrors[key as keyof CheckInFormInput] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    submit.mutate({ token, data: parsed.data });
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-lg mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tightish">Welcome to {property.name}</h1>
        <p className="text-fg-muted text-sm mt-1">
          {property.city}, {property.country}
        </p>
      </div>

      {(property.wifiName || property.wifiPassword || property.lockCode || property.arrivalInstructions) && (
        <div className="surface p-5 mb-6 space-y-3">
          <h2 className="text-sm font-semibold tracking-tightish">Your stay details</h2>
          {property.wifiName && (
            <div>
              <span className="text-xs text-fg-muted">Wi-Fi network</span>
              <p className="font-medium">{property.wifiName}</p>
            </div>
          )}
          {property.wifiPassword && (
            <div>
              <span className="text-xs text-fg-muted">Wi-Fi password</span>
              <p className="font-medium">{property.wifiPassword}</p>
            </div>
          )}
          {property.lockCode && (
            <div>
              <span className="text-xs text-fg-muted">Lock code</span>
              <p className="font-medium">{property.lockCode}</p>
            </div>
          )}
          {property.arrivalInstructions && (
            <div>
              <span className="text-xs text-fg-muted">Arrival instructions</span>
              <p className="text-sm whitespace-pre-wrap">{property.arrivalInstructions}</p>
            </div>
          )}
          {property.ownerContact && (
            <div>
              <span className="text-xs text-fg-muted">Host contact</span>
              <p className="text-sm">{property.ownerContact}</p>
            </div>
          )}
        </div>
      )}

      {alreadySubmitted ? (
        <div className="surface p-8 text-center">
          <p className="text-emerald-600 font-medium">Check-in form submitted</p>
          <p className="text-fg-muted text-sm mt-1">Thank you! Your host has been notified.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="surface p-5 space-y-4">
          <h2 className="text-sm font-semibold tracking-tightish">Guest registration</h2>
          <p className="text-xs text-fg-muted">
            Please fill in your details. This information is required by local authorities.
          </p>

          <label className="block">
            <span className="block text-xs font-medium text-fg-muted mb-1.5">Full name</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              className={inputClass}
            />
            {errors.fullName && <span className="block text-xs text-danger mt-1">{errors.fullName}</span>}
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-fg-muted mb-1.5">Country of residence</span>
            <input
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              className={inputClass}
            />
            {errors.country && <span className="block text-xs text-danger mt-1">{errors.country}</span>}
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-fg-muted mb-1.5">ID / Passport number</span>
            <input
              value={form.citizenId}
              onChange={(e) => setForm((prev) => ({ ...prev, citizenId: e.target.value }))}
              className={inputClass}
            />
            {errors.citizenId && <span className="block text-xs text-danger mt-1">{errors.citizenId}</span>}
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-fg-muted mb-1.5">Date of birth</span>
            <input
              type="date"
              value={form.dob ? new Date(form.dob).toISOString().slice(0, 10) : ''}
              onChange={(e) => {
                const d = e.target.value ? new Date(e.target.value + 'T00:00:00Z') : new Date();
                setForm((prev) => ({ ...prev, dob: d }));
              }}
              className={inputClass}
            />
            {errors.dob && <span className="block text-xs text-danger mt-1">{errors.dob}</span>}
          </label>

          {submit.error && <p className="text-sm text-danger">{submit.error.message}</p>}

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full inline-flex items-center justify-center h-10 px-4 rounded-btn bg-accent text-bg font-medium hover:bg-amber-400 disabled:opacity-60 transition-colors"
          >
            {submit.isPending ? 'Submitting…' : 'Submit check-in'}
          </button>
        </form>
      )}
    </main>
  );
}

const inputClass =
  'w-full h-10 px-3 rounded-btn bg-bg border border-bg-border text-fg placeholder:text-fg-muted/60 focus:border-accent transition-colors';
