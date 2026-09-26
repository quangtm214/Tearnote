import type { Entry } from './db';
import { mucMau, tongTheoNgay } from './lich';

const e = (occurredAt: number, intensity: number): Entry => ({
  id: String(occurredAt),
  occurredAt,
  intensity,
  durationMin: null,
  tags: ['unknown'],
  reflection: null,
});

describe('lịch cường độ', () => {
  it('đổi tổng ra mức theo ngưỡng cố định', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 20].map(mucMau)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('cộng cường độ các Entry cùng ngày, bỏ Entry khác năm', () => {
    const t = tongTheoNgay(
      [
        e(new Date(2026, 2, 4, 1).getTime(), 1),
        e(new Date(2026, 2, 4, 23).getTime(), 5),
        e(new Date(2026, 2, 5, 0, 30).getTime(), 2),
        e(new Date(2025, 2, 4, 12).getTime(), 4),
      ],
      2026,
    );
    expect(t[2][3]).toBe(6);
    expect(t[2][4]).toBe(2);
    expect(t.flat().reduce((a, b) => a + b)).toBe(8);
  });
});
