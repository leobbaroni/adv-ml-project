// Extract check-in form fields from free-text (e.g. a forwarded message from a guest).
// Phase 5 implements the real prompt + JSON-mode call. For now: rule-based stub.

import type { CheckInFormInput } from '@app/shared';

export async function extractCheckInData(text: string): Promise<Partial<CheckInFormInput>> {
  // Stub: a tiny rule-based extractor so the rest of the app can be built around it.
  const out: Partial<CheckInFormInput> = {};
  const nameMatch = text.match(/name[:\s]+([A-Z][a-zA-Z'\- ]{1,80})/i);
  const countryMatch = text.match(/country[:\s]+([A-Za-z ]{2,40})/i);
  if (nameMatch?.[1] || countryMatch?.[1]) {
    out.guests = [
      {
        fullName: nameMatch?.[1]?.trim() ?? 'Unknown',
        country: countryMatch?.[1]?.trim() ?? 'Unknown',
        citizenId: '',
        dob: new Date(),
      },
    ];
  }
  return out;
}
