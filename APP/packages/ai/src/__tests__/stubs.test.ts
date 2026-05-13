import { describe, it, expect } from 'vitest';
import { extractCheckInData } from '../tasks/extract-checkin.js';

describe('ai stubs', () => {
  it('extractCheckInData finds a name', async () => {
    const out = await extractCheckInData('Name: Jane Doe, Country: Portugal');
    expect(out.guests?.[0]?.fullName).toBe('Jane Doe');
  });
});
