import type { Entry } from '@/db';

/**
 * Ngưỡng tổng cường độ của một ngày cho 5 mức màu: 1–2 · 3–4 · 5–6 · 7–9 · 10+.
 * Cố định chứ không tương đối theo năm, để cùng một màu mang cùng một nghĩa ở mọi năm.
 */
export const THRESHOLDS = [1, 3, 5, 7, 10];

/** Tổng cường độ → mức 0–5; 0 là ngày không có Entry. */
export const colorLevel = (total: number) => THRESHOLDS.filter((n) => total >= n).length;

/**
 * Tổng cường độ theo `[tháng 0–11][ngày 0–30]` của một năm. Ngày tính theo giờ trên máy,
 * cùng cách Timeline gom đêm — hai màn không được gom ngày khác nhau.
 */
export function dailyTotals(entries: Entry[], year: number): number[][] {
  const totals = Array.from({ length: 12 }, () => Array<number>(31).fill(0));
  for (const e of entries) {
    const date = new Date(e.occurredAt);
    if (date.getFullYear() === year) totals[date.getMonth()][date.getDate() - 1] += e.intensity;
  }
  return totals;
}
