'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { CheckInFormSchema, type CheckInFormInput, type CheckInGuestInput } from '@app/shared';
import { Plus, Trash2 } from 'lucide-react';

const EMPTY_GUEST: CheckInGuestInput = {
  fullName: '',
  country: '',
  citizenId: '',
  dob: new Date(),
};

export default function GuestCheckInPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const query = trpc.checkin.byToken.useQuery({ token }, { retry: false });
  const submit = trpc.checkin.submit.useMutation({
    onSuccess: () => {
      void query.refetch();
    },
  });

  const [guests, setGuests] = useState<CheckInGuestInput[]>([{ ...EMPTY_GUEST }]);
  const [errors, setErrors] = useState<Record<number, Partial<Record<keyof CheckInGuestInput, string>>>>({});

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

  function updateGuest(index: number, field: keyof CheckInGuestInput, value: string | Date) {
    setGuests((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)),
    );
  }

  function addGuest() {
    setGuests((prev) => [...prev, { ...EMPTY_GUEST }]);
  }

  function removeGuest(index: number) {
    setGuests((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const candidate: CheckInFormInput = {
      guests: guests.map((g) => ({
        fullName: g.fullName.trim(),
        country: g.country.trim(),
        citizenId: g.citizenId.trim(),
        dob: g.dob,
      })),
    };
    const parsed = CheckInFormSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Record<number, Partial<Record<keyof CheckInGuestInput, string>>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path;
        if (path[0] === 'guests' && typeof path[1] === 'number') {
          const idx = path[1];
          const key = path[2];
          if (typeof key === 'string') {
            fieldErrors[idx] = { ...fieldErrors[idx], [key]: issue.message };
          }
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
        <form onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-sm font-semibold tracking-tightish">Guest registration</h2>
          <p className="text-xs text-fg-muted">
            Please fill in details for all guests. This information is required by local authorities.
          </p>

          {guests.map((guest, index) => (
            <div key={index} className="surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                  Guest {index + 1}
                </h3>
                {guests.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuest(index)}
                    className="inline-flex items-center gap-1 text-xs text-danger hover:text-danger/80 transition-colors"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>

              <label className="block">
                <span className="block text-xs font-medium text-fg-muted mb-1.5">Full name</span>
                <input
                  value={guest.fullName}
                  onChange={(e) => updateGuest(index, 'fullName', e.target.value)}
                  className={inputClass}
                />
                {errors[index]?.fullName && (
                  <span className="block text-xs text-danger mt-1">{errors[index].fullName}</span>
                )}
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-fg-muted mb-1.5">Country of residence</span>
                <input
                  value={guest.country}
                  onChange={(e) => updateGuest(index, 'country', e.target.value)}
                  className={inputClass}
                />
                {errors[index]?.country && (
                  <span className="block text-xs text-danger mt-1">{errors[index].country}</span>
                )}
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-fg-muted mb-1.5">ID / Passport number</span>
                <input
                  value={guest.citizenId}
                  onChange={(e) => updateGuest(index, 'citizenId', e.target.value)}
                  className={inputClass}
                />
                {errors[index]?.citizenId && (
                  <span className="block text-xs text-danger mt-1">{errors[index].citizenId}</span>
                )}
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-fg-muted mb-1.5">Date of birth</span>
                <input
                  type="date"
                  value={guest.dob ? new Date(guest.dob).toISOString().slice(0, 10) : ''}
                  onChange={(e) => {
                    const d = e.target.value ? new Date(e.target.value + 'T00:00:00Z') : new Date();
                    updateGuest(index, 'dob', d);
                  }}
                  className={inputClass}
                />
                {errors[index]?.dob && (
                  <span className="block text-xs text-danger mt-1">{errors[index].dob}</span>
                )}
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={addGuest}
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-btn border border-bg-border text-fg hover:bg-bg-surface transition-colors"
          >
            <Plus size={16} /> Add another guest
          </button>

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
