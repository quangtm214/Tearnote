import { readFileSync } from 'fs';
import { join } from 'path';
import { MAX_ENTRY_TAGS, normalizeTags, TAG_IDS, TAG_LABEL_VI, type TagId } from './tags';

/**
 * Tag là contract ba bên: docs/tags.md ⇄ enum `tag` trong Postgres ⇄ file này.
 * Test này đỏ nghĩa là ba bên đã lệch nhau — sửa cho khớp, đừng sửa test.
 */
describe('contract Tag', () => {
  const repoRoot = join(__dirname, '..', '..');

  it('khớp enum `tag` trong migration Postgres', () => {
    const sql = readFileSync(join(repoRoot, 'supabase', 'migrations', '0001_init.sql'), 'utf8');
    const block = sql.match(/create type tag as enum \(([\s\S]*?)\);/)![1];
    const fromSql = [...block.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(fromSql).toEqual([...TAG_IDS]);
  });

  it('khớp danh sách trong docs/tags.md', () => {
    const md = readFileSync(join(repoRoot, 'docs', 'tags.md'), 'utf8');
    for (const id of TAG_IDS) expect(md).toContain(`\`${id}\``);
  });

  it('mỗi tag đều có nhãn tiếng Việt', () => {
    for (const id of TAG_IDS) expect(TAG_LABEL_VI[id]).toBeTruthy();
  });
});

describe('normalizeTags', () => {
  it('không chọn gì thì rơi về unknown, không phải mảng rỗng', () => {
    expect(normalizeTags([])).toEqual(['unknown']);
  });

  it('cắt còn 3 tag thay vì báo lỗi', () => {
    const bon: TagId[] = ['grief', 'pressure', 'family', 'anxiety'];
    expect(normalizeTags(bon)).toHaveLength(MAX_ENTRY_TAGS);
    expect(normalizeTags(bon)).toEqual(['grief', 'pressure', 'family']);
  });

  it('bỏ tag trùng', () => {
    expect(normalizeTags(['grief', 'grief', 'family'])).toEqual(['grief', 'family']);
  });

  it('giữ nguyên khi đã hợp lệ', () => {
    expect(normalizeTags(['moved'])).toEqual(['moved']);
  });
});
