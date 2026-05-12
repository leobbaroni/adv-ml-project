import { describe, it, expect } from 'vitest';
import { parseICal } from '../parse.js';

describe('parseICal (placeholder)', () => {
  it('returns an empty array for empty input', () => {
    expect(parseICal('')).toEqual([]);
  });
});
