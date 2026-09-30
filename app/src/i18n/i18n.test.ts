import { readFileSync } from 'fs';
import { join } from 'path';

import { butChi } from '../theme';
import { chonNgonNgu, datNgonNgu, LANGS, ngonNgu, t } from './index';

// db.ts mở SQLite ngay khi import — không có trong Jest.
jest.mock('../db', () => ({ getSetting: () => null, setSetting: () => {} }));

describe('chọn ngôn ngữ', () => {
  it('đã chọn trong Cài đặt thì theo đó, bất kể máy', () => {
    expect(chonNgonNgu('ja', 'vi_VN')).toBe('ja');
  });

  it('chưa chọn thì theo máy, cả dạng Android lẫn BCP 47', () => {
    expect(chonNgonNgu(null, 'vi_VN')).toBe('vi');
    expect(chonNgonNgu(null, 'ja-JP')).toBe('ja');
    expect(chonNgonNgu(null, 'en_GB')).toBe('en');
  });

  it('máy dùng tiếng khác, hoặc giá trị đã lưu hỏng, thì tiếng Anh', () => {
    expect(chonNgonNgu(null, 'fr_FR')).toBe('en');
    expect(chonNgonNgu(null, 'zh_CN_#Hans')).toBe('en');
    expect(chonNgonNgu('xx', 'ko-KR')).toBe('en');
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
});

describe('đổi ngôn ngữ', () => {
  it('ghi đè chữ và họ chữ tay ngay tại chỗ', () => {
    // RN đóng băng style đã truyền qua prop — đổi ngôn ngữ phải thay object, không sửa bên trong.
    Object.values(butChi).forEach((kieu) => Object.freeze(kieu));
    datNgonNgu('ja');
    expect(ngonNgu()).toBe('ja');
    expect(t.tab.lich).toBe('カレンダー');
    expect(butChi.tieuDe.fontFamily).toBe('Yomogi');

    datNgonNgu('vi');
    expect(t.tab.lich).toBe('Lịch');
    expect(butChi.tieuDe.fontFamily).toBe('PatrickHand');
  });
});
