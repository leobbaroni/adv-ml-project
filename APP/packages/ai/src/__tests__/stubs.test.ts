import { describe, it, expect } from 'vitest';
import { extractCheckInData } from '../tasks/extract-checkin.js';
import { resolveOverlap } from '../tasks/resolve-overlap.js';

describe('ai stubs', () => {
  it('extractCheckInData finds a name', async () => {
    const out = await extractCheckInData('Name: Jane Doe, Country: Portugal');
    expect(out.fullName).toBe('Jane Doe');
  });

  it('resolveOverlap defaults to NEEDS_HUMAN', async () => {
    const out = await resolveOverlap({ events: [] });
    expect(out.action).toBe('NEEDS_HUMAN');
  });
});
