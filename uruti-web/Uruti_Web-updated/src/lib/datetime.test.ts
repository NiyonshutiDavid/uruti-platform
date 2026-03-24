import { describe, expect, it } from 'vitest';

import { formatRelativeTime, parseServerDate, toEpochMs } from './datetime';

describe('parseServerDate', () => {
  it('returns epoch for empty values', () => {
    expect(parseServerDate('').getTime()).toBe(0);
    expect(parseServerDate(null).getTime()).toBe(0);
  });

  it('normalizes datetime strings without timezone as UTC', () => {
    expect(parseServerDate('2026-03-24T10:30:00').toISOString()).toBe(
      '2026-03-24T10:30:00.000Z',
    );
  });
});

describe('toEpochMs', () => {
  it('returns zero for invalid values', () => {
    expect(toEpochMs('not-a-date')).toBe(0);
  });
});

describe('formatRelativeTime', () => {
  it('formats recent timestamps in minutes', () => {
    const timestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(timestamp)).toBe('5m ago');
  });
});