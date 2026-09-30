import { I18nManager } from 'react-native';

import { getSetting, setSetting } from '../db';
import { TAG_LABEL, type TagId } from '../tags';
import { datChuTay } from '../theme';
import en from './en';
import ja from './ja';
import vi, { type TuDien } from './vi';

/**
 * Đa ngôn ngữ tự dựng, không thư viện. Chữ trên UI nằm trong từ điển: `vi.ts` là khuôn, `en.ts` /
 * `ja.ts` thiếu hay thừa khoá nào thì tsc đỏ. Dữ liệu có tên theo ngôn ngữ (nhãn Tag, hotline,
 * tên nước) để `Record<Lang, …>` ngay cạnh dữ liệu đó.
 *
 * Thêm ngôn ngữ: `alter type lang add value` (migration), thêm vào LANGS, thêm một file từ điển —
 * rồi tsc chỉ ra mọi chỗ còn thiếu.
 */

/** Khớp enum `lang` trong Postgres (i18n.test.ts kiểm). Đây cũng là thứ tự hiện trong Cài đặt. */
export const LANGS = ['vi', 'en', 'ja'] as const;
export type Lang = (typeof LANGS)[number];

/** Tên ngôn ngữ viết bằng chính nó: ai lỡ chọn nhầm vẫn nhận ra tiếng của mình. */
export const TEN_GOC: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English', ja: '日本語' };

const TU_DIEN: Record<Lang, TuDien> = { vi, en, ja };
const KHOA = 'ngon_ngu';

/**
 * Đã chọn trong Cài đặt thì theo đó; chưa chọn thì theo máy; máy dùng tiếng khác thì tiếng Anh.
 * `may` là locale của máy, dạng "vi_VN" (Android) hoặc "ja-JP" (Intl).
 */
export function chonNgonNgu(daLuu: string | null, may: string): Lang {
  const la = (x: string | null) => LANGS.find((l) => l === x);
  return la(daLuu) ?? la(may.split(/[-_]/)[0].toLowerCase()) ?? 'en';
}

// ponytail: iOS không có localeIdentifier nên hỏi Intl — chưa kiểm được trên iPhone thật; lệch thì
// thay bằng expo-localization.
const localeMay = () =>
  I18nManager.getConstants().localeIdentifier ?? Intl.DateTimeFormat().resolvedOptions().locale;

let hienTai: Lang = 'vi';
let khiDoi: ((l: Lang) => void) | undefined;

/**
 * Chữ của ngôn ngữ đang dùng. Đọc lúc render, đừng chép ra hằng số cấp module: đổi ngôn ngữ là ghi
 * đè object này rồi dựng lại cây giao diện, bản đã chép sẽ nằm lại ở ngôn ngữ cũ.
 */
export const t: TuDien = { ...vi };

export const ngonNgu = () => hienTai;

function ap(l: Lang) {
  hienTai = l;
  Object.assign(t, TU_DIEN[l]);
  datChuTay(l);
}

/** Đổi ngôn ngữ từ Cài đặt: lưu lại, rồi báo _layout gốc dựng lại cây. */
export function datNgonNgu(l: Lang) {
  if (l === hienTai) return;
  ap(l);
  setSetting(KHOA, l);
  khiDoi?.(l);
}

/** Chỉ _layout gốc nghe — nó giữ `key` của Stack. */
export function theoDoiNgonNgu(f: (l: Lang) => void) {
  khiDoi = f;
  return () => {
    khiDoi = undefined;
  };
}

export const nhanTag = (tag: TagId) => TAG_LABEL[hienTai][tag];

/** Vài nhãn có dấu phẩy bên trong, nên nhiều Tag nối bằng dấu riêng của từng tiếng (`noiTag`). */
export const nhanTags = (tags: readonly TagId[]) => tags.map(nhanTag).join(t.noiTag);

ap(chonNgonNgu(getSetting(KHOA), localeMay()));
