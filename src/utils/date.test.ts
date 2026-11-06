import { describe, expect, it } from 'vitest';
import { addDaysIso, formatShortDate, parseIsoDate, presetRange, toIsoDate } from './date';

describe('date utils', () => {
  it('reads YYYY-MM-DD as a local calendar day, not UTC midnight', () => {
    const date = parseIsoDate('2026-11-05');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10);
    expect(date.getDate()).toBe(5);
    expect(toIsoDate(date)).toBe('2026-11-05');
  });

  it('formats in Spanish without shifting the day', () => {
    expect(formatShortDate('2026-11-05')).toBe('5 nov');
    expect(formatShortDate('2026-11-05', true)).toBe('5 nov 2026');
  });

  it('adds days across month boundaries', () => {
    expect(addDaysIso('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('builds inclusive report ranges', () => {
    const now = new Date(2026, 10, 15);
    expect(presetRange('last7days', now)).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(presetRange('thisMonth', now)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(presetRange('lastMonth', now)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });
});
