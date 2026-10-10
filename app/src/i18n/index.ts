import { I18nManager } from 'react-native';

import { getSetting, setSetting } from '../db';
import { TAG_LABEL, type TagId } from '../tags';
import { setHandwriting } from '../theme';
import en from './en';
import ja from './ja';
import vi, { type Dictionary } from './vi';

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
export const NATIVE_NAMES: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English', ja: '日本語' };

const DICTIONARIES: Record<Lang, Dictionary> = { vi, en, ja };
const LANG_SETTING_KEY = 'ngon_ngu';

/**
 * Đã chọn trong Cài đặt thì theo đó; chưa chọn thì theo máy; máy dùng tiếng khác thì tiếng Anh.
 * `may` là locale của máy, dạng "vi_VN" (Android) hoặc "ja-JP" (Intl).
 */
export function pickLanguage(saved: string | null, device: string): Lang {
  const match = (value: string | null) => LANGS.find((l) => l === value);
  return match(saved) ?? match(device.split(/[-_]/)[0].toLowerCase()) ?? 'en';
}

// ponytail: iOS không có localeIdentifier nên hỏi Intl — chưa kiểm được trên iPhone thật; lệch thì
// thay bằng expo-localization.
const deviceLocale = () =>
  I18nManager.getConstants().localeIdentifier ?? Intl.DateTimeFormat().resolvedOptions().locale;

/** Vùng của máy: "vi_VN" → "VN", "en-GB" → "GB", "en" → undefined. Màn hotline đưa nước này lên đầu. */
export const deviceRegion = () => deviceLocale().split(/[-_]/)[1]?.toUpperCase();

let current: Lang = 'vi';
let onChange: ((l: Lang) => void) | undefined;

/**
 * Chữ của ngôn ngữ đang dùng. Đọc lúc render, đừng chép ra hằng số cấp module: đổi ngôn ngữ là ghi
 * đè object này rồi dựng lại cây giao diện, bản đã chép sẽ nằm lại ở ngôn ngữ cũ.
 */
export const t: Dictionary = { ...vi };

export const currentLang = () => current;

function apply(l: Lang) {
  current = l;
  Object.assign(t, DICTIONARIES[l]);
  setHandwriting(l);
}

/** Đổi ngôn ngữ từ Cài đặt: lưu lại, rồi báo _layout gốc dựng lại cây. */
export function setLanguage(l: Lang) {
  if (l === current) return;
  apply(l);
  setSetting(LANG_SETTING_KEY, l);
  onChange?.(l);
}

/** Chỉ _layout gốc nghe — nó giữ `key` của Stack. */
export function subscribeLanguage(listener: (l: Lang) => void) {
  onChange = listener;
  return () => {
    onChange = undefined;
  };
}

export const tagLabel = (tag: TagId) => TAG_LABEL[current][tag];

/** Vài nhãn có dấu phẩy bên trong, nên nhiều Tag nối bằng dấu riêng của từng tiếng (`tagSeparator`). */
export const tagLabels = (tags: readonly TagId[]) => tags.map(tagLabel).join(t.tagSeparator);

apply(pickLanguage(getSetting(LANG_SETTING_KEY), deviceLocale()));
