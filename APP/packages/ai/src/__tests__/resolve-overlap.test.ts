import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock('../router.js', () => ({
  getAiClient: vi.fn(() => ({
    chat: {
      completions: {
        create: createMock,
      },
    },
  })),
  getAiModel: vi.fn(() => 'test-model'),
}));

import { resolveOverlap } from '../tasks/resolve-overlap.js';

describe('resolveOverlap', () => {
  beforeEach(() => {
    createMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns SUPPRESS when AI responds with valid JSON', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              action: 'SUPPRESS',
              targetReservationId: 'evt-2',
              rationale: 'Duplicate from lower-priority platform.',
            }),
          },
        },
      ],
    });

    const result = await resolveOverlap({
      events: [
        {
          id: 'evt-1',
          summary: 'John - ABC123',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-05'),
          sourceLabel: 'AIRBNB',
        },
        {
          id: 'evt-2',
          summary: 'Jane - DEF456',
          startDate: new Date('2025-06-03'),
          endDate: new Date('2025-06-07'),
          sourceLabel: 'BOOKING',
        },
      ],
    });

    expect(result).toEqual({
      action: 'SUPPRESS',
      targetReservationId: 'evt-2',
      rationale: 'Duplicate from lower-priority platform.',
    });
  });

  it('returns KEEP_BOTH when AI responds with valid JSON', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              action: 'KEEP_BOTH',
              rationale: 'Overlap is a cleaning window.',
            }),
          },
        },
      ],
    });

    const result = await resolveOverlap({
      events: [
        {
          id: 'evt-1',
          summary: 'Blocked - Cleaning',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-05'),
          sourceLabel: 'AIRBNB',
        },
        {
          id: 'evt-2',
          summary: 'Guest - XYZ999',
          startDate: new Date('2025-06-03'),
          endDate: new Date('2025-06-07'),
          sourceLabel: 'VRBO',
        },
      ],
    });

    expect(result).toEqual({
      action: 'KEEP_BOTH',
      rationale: 'Overlap is a cleaning window.',
    });
  });

  it('falls back to NEEDS_HUMAN when AI API throws', async () => {
    createMock.mockRejectedValueOnce(new Error('API key invalid'));

    const result = await resolveOverlap({
      events: [
        {
          id: 'evt-1',
          summary: 'Test',
          startDate: new Date(),
          endDate: new Date(),
          sourceLabel: 'AIRBNB',
        },
        {
          id: 'evt-2',
          summary: 'Test',
          startDate: new Date(),
          endDate: new Date(),
          sourceLabel: 'BOOKING',
        },
      ],
    });

    expect(result.action).toBe('NEEDS_HUMAN');
    expect(result.rationale).toBe('AI unavailable; manual review needed.');
  });

  it('falls back to NEEDS_HUMAN when AI returns invalid JSON', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'This is not JSON' } }],
    });

    const result = await resolveOverlap({
      events: [
        {
          id: 'evt-1',
          summary: 'Test',
          startDate: new Date(),
          endDate: new Date(),
          sourceLabel: 'AIRBNB',
        },
        {
          id: 'evt-2',
          summary: 'Test',
          startDate: new Date(),
          endDate: new Date(),
          sourceLabel: 'BOOKING',
        },
      ],
    });

    expect(result.action).toBe('NEEDS_HUMAN');
    expect(result.rationale).toBe('AI unavailable; manual review needed.');
  });

  it('falls back to NEEDS_HUMAN when AI response fails schema validation', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              action: 'INVALID_ACTION',
              rationale: 'Bad action value.',
            }),
          },
        },
      ],
    });

    const result = await resolveOverlap({
      events: [
        {
          id: 'evt-1',
          summary: 'Test',
          startDate: new Date(),
          endDate: new Date(),
          sourceLabel: 'AIRBNB',
        },
        {
          id: 'evt-2',
          summary: 'Test',
          startDate: new Date(),
          endDate: new Date(),
          sourceLabel: 'BOOKING',
        },
      ],
    });

    expect(result.action).toBe('NEEDS_HUMAN');
    expect(result.rationale).toBe('AI unavailable; manual review needed.');
  });
});
