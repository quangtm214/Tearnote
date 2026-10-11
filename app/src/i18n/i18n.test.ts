import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

import { pencil } from '../theme';
import { pickLanguage, setLanguage, LANGS, currentLang, t } from './index';

// db.ts opens SQLite on import, which Jest does not have.
jest.mock('../db', () => ({ getSetting: () => null, setSetting: () => {} }));

describe('chọn ngôn ngữ', () => {
  it('đã chọn trong Cài đặt thì theo đó, bất kể máy', () => {
    expect(pickLanguage('ja', 'vi_VN')).toBe('ja');
  });

  it('chưa chọn thì theo máy, cả dạng Android lẫn BCP 47', () => {
    expect(pickLanguage(null, 'vi_VN')).toBe('vi');
    expect(pickLanguage(null, 'ja-JP')).toBe('ja');
    expect(pickLanguage(null, 'en_GB')).toBe('en');
  });

  it('máy dùng tiếng khác, hoặc giá trị đã lưu hỏng, thì tiếng Anh', () => {
    expect(pickLanguage(null, 'fr_FR')).toBe('en');
    expect(pickLanguage(null, 'zh_CN_#Hans')).toBe('en');
    expect(pickLanguage('xx', 'ko-KR')).toBe('en');
  });
});

describe('contract ngôn ngữ', () => {
  it('LANGS khớp enum `lang` trong migration Postgres', () => {
    const sql = readFileSync(
      join(__dirname, '..', '..', '..', 'supabase', 'migrations', '0001_init.sql'),
      'utf8',
    );
    const block = sql.match(/create type lang as enum \(([^)]*)\);/)![1];
    const fromSql = [...block.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect([...fromSql].sort()).toEqual([...LANGS].sort());
  });

  it('màn hình không viết cứng chữ Việt — chữ UI phải nằm trong từ điển', () => {
    // Branches older than i18n tend to bring Vietnamese straight into JSX: en/ja users would see it and
    // tsc would not notice. Skips comments and `Record<Lang, …>` data (lines with `vi: `).
    const src = join(__dirname, '..');
    const files = [
      join(src, 'ui.tsx'),
      ...readdirSync(join(src, 'app'), { recursive: true })
        .map(String)
        .filter((f) => f.endsWith('.tsx'))
        .map((f) => join(src, 'app', f)),
    ];
    const vietnameseChars = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/iu;
    const hardcoded = files.flatMap((f) =>
      readFileSync(f, 'utf8')
        // Blank out block comments but keep their newlines so reported line numbers stay correct.
        .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ''))
        .split(/\r?\n/)
        .map((line, i) => ({ line: line.replace(/\/\/.*$/, ''), lineNo: i + 1 }))
        .filter(({ line }) => vietnameseChars.test(line) && !/\bvi: /.test(line))
        .map(({ line, lineNo }) => `${relative(src, f)}:${lineNo}: ${line.trim()}`),
    );
    expect(hardcoded).toEqual([]);
  });

  it('comment viết tiếng Anh (.claude/rules/comments.md)', () => {
    // Quoted examples ("l ần", "bạn") are allowed: they show Vietnamese text, not explain in it.
    const src = join(__dirname, '..');
    const vietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/iu;
    const offenders = readdirSync(src, { recursive: true })
      .map(String)
      .filter((f) => /\.tsx?$/.test(f))
      .flatMap((f) =>
        (readFileSync(join(src, f), 'utf8').match(/\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/.*/gm) ?? [])
          .filter((c) => vietnamese.test(c.replace(/"[^"\n]*"/g, '')))
          .map((c) => `${f}: ${c.slice(0, 80)}`),
      );
    expect(offenders).toEqual([]);
  });
});

describe('đổi ngôn ngữ', () => {
  it('ghi đè chữ và họ chữ tay ngay tại chỗ', () => {
    // RN freezes styles passed as props — a language switch must replace objects, not mutate them.
    Object.values(pencil).forEach((style) => Object.freeze(style));
    setLanguage('ja');
    expect(currentLang()).toBe('ja');
    expect(t.tab.calendar).toBe('カレンダー');
    expect(pencil.title.fontFamily).toBe('Yomogi');

    setLanguage('vi');
    expect(t.tab.calendar).toBe('Lịch');
    expect(pencil.title.fontFamily).toBe('PatrickHand');
  });
});
