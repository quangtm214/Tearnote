import type { Entry } from '@/db';

/**
 * Daily intensity-sum thresholds for the 5 color levels: 1–2 · 3–4 · 5–6 · 7–9 · 10+.
 * Fixed, not relative to the year, so a color means the same thing in every year.
 */
export const THRESHOLDS = [1, 3, 5, 7, 10];

/** Intensity sum → level 0–5; 0 = no Entry that day. */
export const colorLevel = (total: number) => THRESHOLDS.filter((n) => total >= n).length;

/**
 * Intensity sums as `[month 0–11][day 0–30]` for one year. Days use device local time, the same way
 * Timeline groups nights — the two screens must never disagree on a day.
 */
export function dailyTotals(entries: Entry[], year: number): number[][] {
  const totals = Array.from({ length: 12 }, () => Array<number>(31).fill(0));
  for (const e of entries) {
    const date = new Date(e.occurredAt);
    if (date.getFullYear() === year) totals[date.getMonth()][date.getDate() - 1] += e.intensity;
  }
  return totals;
}
