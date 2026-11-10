import { readFileSync } from 'fs';
import { join } from 'path';

import { LANGS } from './i18n';
import { isJoyOnly, MAX_ENTRY_TAGS, normalizeTags, TAGS_BUNDLED, UNKNOWN_TAG } from './tags';
import { tagRow } from './validation';

// i18n imports db.ts, which opens SQLite on import — Jest does not have it.
jest.mock('./db', () => ({ getSetting: () => null, setSetting: () => {} }));

/**
 * The list lives in the server `tags` table (ADR 0009). The only copy left in code is the bundle,
 * which must equal the migration seed so an offline first launch starts where the server started.
 */
describe('bản Tag đóng gói', () => {
  it('khớp seed trong migration 0003', () => {
    const sql = readFileSync(join(__dirname, '..', '..', 'supabase', 'migrations', '0003_tags_table.sql'), 'utf8');
    const rows = [...sql.matchAll(/^\s*\('([a-z_]+)',\s*'(\w+)',\s*(\d+),\s*'(\{.*\})'\)[,;]$/gm)];
    const seed = rows.map(([, id, kind, sort, labels]) => ({ id, kind, sort: Number(sort), labels: JSON.parse(labels) }));
    expect(seed).toEqual(TAGS_BUNDLED.map(({ id, kind, sort, labels }) => ({ id, kind, sort, labels })));
  });

  it('id không trùng, đúng một Tag "unknown", nhãn đủ mọi ngôn ngữ', () => {
    const ids = TAGS_BUNDLED.map((tag) => tag.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TAGS_BUNDLED.filter((tag) => tag.kind === 'unknown').map((tag) => tag.id)).toEqual([UNKNOWN_TAG]);
    for (const tag of TAGS_BUNDLED) for (const l of LANGS) expect(tag.labels[l].trim()).not.toBe('');
  });

  it('mọi Tag đóng gói đều đang hiện', () => {
    expect(TAGS_BUNDLED.every((tag) => tag.active)).toBe(true);
  });
});

describe('dòng tags từ server', () => {
  const row = { id: 'grief', kind: 'sad', labels: { vi: 'a', en: 'b', ja: 'c' }, sort: 20, active: true };

  it('nhãn có ngôn ngữ app chưa biết vẫn qua', () => {
    expect(tagRow.safeParse({ ...row, labels: { ...row.labels, ko: 'd' } }).success).toBe(true);
  });

  it('thiếu active hoặc kind lạ thì hỏng (dòng đó bị bỏ qua)', () => {
    const { active: _, ...noActive } = row;
    expect(tagRow.safeParse(noActive).success).toBe(false);
    expect(tagRow.safeParse({ ...row, kind: 'x' }).success).toBe(false);
  });
});

describe('isJoyOnly', () => {
  it('chỉ đúng khi mọi Tag đều là chuyện vui', () => {
    expect(isJoyOnly(['moved'])).toBe(true);
    expect(isJoyOnly(['moved', 'grief'])).toBe(false);
    expect(isJoyOnly([UNKNOWN_TAG])).toBe(false);
    expect(isJoyOnly([])).toBe(false);
  });
});

describe('normalizeTags', () => {
  it('không chọn gì thì rơi về unknown, không phải mảng rỗng', () => {
    expect(normalizeTags([])).toEqual(['unknown']);
  });

  it('cắt còn 3 tag thay vì báo lỗi', () => {
    const four = ['grief', 'pressure', 'family', 'anxiety'];
    expect(normalizeTags(four)).toHaveLength(MAX_ENTRY_TAGS);
    expect(normalizeTags(four)).toEqual(['grief', 'pressure', 'family']);
  });

  it('bỏ tag trùng', () => {
    expect(normalizeTags(['grief', 'grief', 'family'])).toEqual(['grief', 'family']);
  });

  it('giữ nguyên khi đã hợp lệ', () => {
    expect(normalizeTags(['moved'])).toEqual(['moved']);
  });
});
