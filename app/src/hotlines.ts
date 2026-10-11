import type { Lang } from './i18n';

/**
 * Offline fallback bundled with the app. ADR 0005: a help button that needs the network is broken —
 * signal, data or the server fail exactly when it is needed most.
 *
 * The server `hotlines` table is the up-to-date copy; use it when it loads, otherwise this.
 * That table has only one language for `name`/`hours` — add translations before the app reads it
 * (docs/db.md).
 *
 * Within a country: emergency first, then 24h lines, then lines with hours — at midnight the user
 * must see a number they can call right now first. Hours are written as words so screen readers
 * read them correctly. Proper names stay untranslated; descriptions are translated.
 */
type Localized = Record<Lang, string>;

export type Hotline = {
  country: string;
  name: Localized;
  phone?: string;
  url?: string;
  hours?: Localized;
};

const ALL_DAY: Localized = { vi: '24 giờ, mọi ngày', en: '24 hours, every day', ja: '24時間・毎日' };
const EMERGENCY: Localized = { vi: 'Cấp cứu', en: 'Emergency', ja: '救急' };

/** Country shown first: the device region if listed, otherwise by app language. */
export const topCountry = (region: string | undefined, lang: Lang): string =>
  region && HOTLINES_FALLBACK.some((h) => h.country === region) ? region : ({ vi: 'VN', ja: 'JP', en: 'US' } as const)[lang];

export const HOTLINES_FALLBACK: Hotline[] = [
  { country: 'VN', name: EMERGENCY, phone: '115', hours: ALL_DAY },
  {
    country: 'VN',
    name: {
      vi: 'Tổng đài Quốc gia Bảo vệ Trẻ em',
      en: 'National Child Protection Hotline',
      ja: '子ども保護全国ホットライン',
    },
    phone: '111',
    hours: ALL_DAY,
  },
  {
    country: 'VN',
    name: {
      vi: 'Đường dây nóng Ngày Mai (sức khoẻ tâm thần)',
      en: 'Ngày Mai Hotline (mental health)',
      ja: 'Ngày Mai（心の健康相談）',
    },
    phone: '096 306 1414',
    hours: {
      vi: 'Thứ Tư đến Chủ nhật, 13:00–20:30',
      en: 'Wednesday to Sunday, 13:00–20:30',
      ja: '水曜〜日曜、13:00〜20:30',
    },
  },
  { country: 'JP', name: EMERGENCY, phone: '119', hours: ALL_DAY },
  {
    country: 'JP',
    name: {
      vi: 'こころの健康相談統一ダイヤル (sức khoẻ tâm thần, nói tiếng Nhật)',
      en: 'こころの健康相談統一ダイヤル (mental health, in Japanese)',
      ja: 'こころの健康相談統一ダイヤル（日本語）',
    },
    phone: '0570-064-556',
    hours: { vi: 'Tuỳ tỉnh, thành', en: 'Varies by prefecture', ja: '都道府県により異なる' },
  },
  {
    country: 'JP',
    name: {
      vi: 'TELL Lifeline (nói tiếng Anh)',
      en: 'TELL Lifeline (in English)',
      ja: 'TELL Lifeline（英語）',
    },
    phone: '03-5774-0992',
    url: 'https://telljp.com',
    hours: { vi: '9:00–23:00', en: '9:00–23:00', ja: '9:00〜23:00' },
  },
  { country: 'US', name: EMERGENCY, phone: '911', hours: ALL_DAY },
  {
    country: 'US',
    name: {
      vi: '988 Suicide & Crisis Lifeline',
      en: '988 Suicide & Crisis Lifeline',
      ja: '988 Suicide & Crisis Lifeline',
    },
    phone: '988',
    url: 'https://988lifeline.org',
    hours: ALL_DAY,
  },
  { country: 'GB', name: EMERGENCY, phone: '999', hours: ALL_DAY },
  {
    country: 'GB',
    name: { vi: 'Samaritans', en: 'Samaritans', ja: 'Samaritans' },
    phone: '116 123',
    url: 'https://samaritans.org',
    hours: ALL_DAY,
  },
];
