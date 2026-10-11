import type { Lang } from './i18n';

/**
 * Tag contract. Source of truth: docs/tags.md and the Postgres `tag` enum.
 * All three must match — change one, change all. Do not add/remove Tags without asking.
 *
 * Tags describe the SITUATION, not how strong the feeling is (that is intensity 1–5).
 */
export const TAG_IDS = [
  'heartbreak',
  'grief',
  'pressure',
  'self_worth',
  'loneliness',
  'family',
  'overwhelm',
  'anxiety',
  'moved',
  'unknown',
] as const;

export type TagId = (typeof TAG_IDS)[number];

/**
 * Labels per language — must equal the vi/en/ja columns of docs/tags.md (checked by tags.test.ts).
 * Labels decide whether writer and reader understand a Tag the same way, so they are part of matching,
 * not just button text: en/ja translate the MEANING of the vi column, not the id.
 */
export const TAG_LABEL: Record<Lang, Record<TagId, string>> = {
  vi: {
    heartbreak: 'Chuyện tình cảm',
    grief: 'Mất người thân',
    pressure: 'Áp lực công việc, học tập',
    self_worth: 'Thấy mình không đủ tốt',
    loneliness: 'Cô đơn',
    family: 'Chuyện gia đình',
    overwhelm: 'Kiệt sức, quá tải',
    anxiety: 'Lo về tương lai',
    moved: 'Vì vui, vì cảm động',
    unknown: 'Không rõ vì sao',
  },
  en: {
    heartbreak: 'Love life',
    grief: 'Losing a loved one',
    pressure: 'Work or school pressure',
    self_worth: 'Feeling not good enough',
    loneliness: 'Feeling lonely',
    family: 'Family matters',
    overwhelm: 'Exhausted, overwhelmed',
    anxiety: 'Worried about the future',
    moved: 'Happy or touched',
    unknown: 'Not sure why',
  },
  ja: {
    heartbreak: '恋愛のこと',
    grief: '大切な人を亡くした',
    pressure: '仕事や勉強のプレッシャー',
    self_worth: '自分はダメだと感じる',
    loneliness: 'さみしい',
    family: '家族のこと',
    overwhelm: '疲れ果てて、もう限界',
    anxiety: '将来への不安',
    moved: 'うれしくて、感動して',
    unknown: '理由がわからない',
  },
};

/** Max 3 Tags per Entry, 2 per Comfort. Both have a matching CHECK in the migration. */
export const MAX_ENTRY_TAGS = 3;
export const MAX_COMFORT_TAGS = 2;

/**
 * No Tag selected ⇒ 'unknown', a real Tag (not an empty value) with its own Comforts in the pool.
 * Extra Tags are cut instead of rejected: someone who just cried should not be blocked by a
 * validation error.
 */
export function normalizeTags(picked: readonly TagId[]): TagId[] {
  const unique = [...new Set(picked)];
  return unique.length === 0 ? ['unknown'] : unique.slice(0, MAX_ENTRY_TAGS);
}
