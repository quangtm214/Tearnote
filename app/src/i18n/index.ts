import { I18nManager } from 'react-native';

import { getSetting, setSetting } from '../db';
import { TAG_LABEL, type TagId } from '../tags';
import { setHandwriting } from '../theme';
import en from './en';
import ja from './ja';
import vi, { type Dictionary } from './vi';

/**
 * Hand-rolled i18n, no library. UI text lives in dictionaries: `vi.ts` is the template; tsc fails when
 * `en.ts` / `ja.ts` miss or add a key. Data with per-language names (Tag labels, hotlines, countries)
 * keeps its `Record<Lang, …>` next to the data.
 *
 * Adding a language: `alter type lang add value` (migration), add it to LANGS, add a dictionary file —
 * then tsc points to everything still missing.
 */

/** Matches the Postgres `lang` enum (checked by i18n.test.ts). Also the order shown in Settings. */
export const LANGS = ['vi', 'en', 'ja'] as const;
export type Lang = (typeof LANGS)[number];

/** Each language named in itself, so someone who switched by mistake can still find theirs. */
export const NATIVE_NAMES: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English', ja: '日本語' };

const DICTIONARIES: Record<Lang, Dictionary> = { vi, en, ja };
const LANG_SETTING_KEY = 'ngon_ngu';

/**
 * The Settings choice if any; else the device language; else English.
 * `device` is the device locale, "vi_VN" (Android) or "ja-JP" (Intl).
 */
export function pickLanguage(saved: string | null, device: string): Lang {
  const match = (value: string | null) => LANGS.find((l) => l === value);
  return match(saved) ?? match(device.split(/[-_]/)[0].toLowerCase()) ?? 'en';
}

// ponytail: iOS has no localeIdentifier, so this asks Intl — not tested on a real iPhone; if it is wrong,
// switch to expo-localization.
const deviceLocale = () =>
  I18nManager.getConstants().localeIdentifier ?? Intl.DateTimeFormat().resolvedOptions().locale;

/** Device region: "vi_VN" → "VN", "en-GB" → "GB", "en" → undefined. The hotline screen lists it first. */
export const deviceRegion = () => deviceLocale().split(/[-_]/)[1]?.toUpperCase();

let current: Lang = 'vi';
let onChange: ((l: Lang) => void) | undefined;

/**
 * Text of the current language. Read it during render; never copy it into a module-level constant:
 * switching languages overwrites this object and rebuilds the tree, so a copy stays in the old language.
 */
export const t: Dictionary = { ...vi };

export const currentLang = () => current;

function apply(l: Lang) {
  current = l;
  Object.assign(t, DICTIONARIES[l]);
  setHandwriting(l);
}

/** Language change from Settings: save it, then tell the root _layout to rebuild the tree. */
export function setLanguage(l: Lang) {
  if (l === current) return;
  apply(l);
  setSetting(LANG_SETTING_KEY, l);
  onChange?.(l);
}

/** Only the root _layout listens — it owns the Stack `key`. */
export function subscribeLanguage(listener: (l: Lang) => void) {
  onChange = listener;
  return () => {
    onChange = undefined;
  };
}

export const tagLabel = (tag: TagId) => TAG_LABEL[current][tag];

/** Some labels contain commas, so Tags are joined with a per-language separator (`tagSeparator`). */
export const tagLabels = (tags: readonly TagId[]) => tags.map(tagLabel).join(t.tagSeparator);

apply(pickLanguage(getSetting(LANG_SETTING_KEY), deviceLocale()));
