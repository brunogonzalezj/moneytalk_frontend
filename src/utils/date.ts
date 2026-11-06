import { addDays, endOfMonth, format, parseISO, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

/** Calendar date (YYYY-MM-DD) in the user's local timezone. The API's date format. */
export const toIsoDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export const todayIso = (): string => toIsoDate(new Date());

/** Parses a YYYY-MM-DD calendar date as local midnight (new Date('YYYY-MM-DD') would use UTC). */
export const parseIsoDate = (isoDate: string): Date => parseISO(isoDate.slice(0, 10));

export const addDaysIso = (isoDate: string, days: number): string => toIsoDate(addDays(parseIsoDate(isoDate), days));

/** "6 nov" or, with year, "6 nov 2026". */
export const formatShortDate = (isoDate: string, withYear = false): string =>
  format(parseIsoDate(isoDate), withYear ? 'd MMM yyyy' : 'd MMM', { locale: es });

export type RangePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear';

/** Inclusive calendar range for the report presets. */
export const presetRange = (preset: RangePreset, now = new Date()): { from: string; to: string } => {
  switch (preset) {
    case 'last7days':
      return { from: toIsoDate(addDays(now, -6)), to: toIsoDate(now) };
    case 'last30days':
      return { from: toIsoDate(addDays(now, -29)), to: toIsoDate(now) };
    case 'lastMonth': {
      const previous = subMonths(now, 1);
      return { from: toIsoDate(startOfMonth(previous)), to: toIsoDate(endOfMonth(previous)) };
    }
    case 'thisYear':
      return { from: toIsoDate(startOfYear(now)), to: toIsoDate(now) };
    case 'thisMonth':
    default:
      return { from: toIsoDate(startOfMonth(now)), to: toIsoDate(endOfMonth(now)) };
  }
};
