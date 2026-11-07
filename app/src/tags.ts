import type { Lang } from './i18n';

/**
 * Tags are an admin-managed table on the server (ADR 0009). The app keeps a copy in SQLite (db.ts)
 * and this in-memory list; `TAGS_BUNDLED` covers a first launch with no network.
 *
 * Tags describe the SITUATION, not how strong the feeling is (that is intensity 1–5).
 */
export type TagKind = 'sad' | 'joy' | 'unknown';

/**
 * `labels` may miss a language: the app adds one to LANGS while rows already on the device (and not yet
 * refreshed) lack it. Read through `tagLabel`, which falls back to `en`.
 */
export type Tag = {
  id: string;
  kind: TagKind;
  labels: Partial<Record<Lang, string>>;
  sort: number;
  active: boolean;
};

/** Reserved id: an Entry with no Tag gets it, and request_comfort() falls back to it. */
export const UNKNOWN_TAG = 'unknown';

/**
 * Must equal the seed in supabase/migrations/0003_tags_table.sql (checked by tags.test.ts). Labels translate
 * the MEANING of the vi label, not the id (docs/tags.md). Once the app has loaded the server list, the
 * server wins: this bundle is only the fallback.
 */
export const TAGS_BUNDLED: (Tag & { labels: Record<Lang, string> })[] = [
  { id: 'heartbreak', kind: 'sad', sort: 10, active: true, labels: { vi: 'Chuyện tình cảm', en: 'Love life', ja: '恋愛のこと' } },
  { id: 'grief', kind: 'sad', sort: 20, active: true, labels: { vi: 'Mất người thân', en: 'Losing a loved one', ja: '大切な人を亡くした' } },
  { id: 'pressure', kind: 'sad', sort: 30, active: true, labels: { vi: 'Áp lực công việc, học tập', en: 'Work or school pressure', ja: '仕事や勉強のプレッシャー' } },
  { id: 'self_worth', kind: 'sad', sort: 40, active: true, labels: { vi: 'Thấy mình không đủ tốt', en: 'Feeling not good enough', ja: '自分はダメだと感じる' } },
  { id: 'loneliness', kind: 'sad', sort: 50, active: true, labels: { vi: 'Cô đơn', en: 'Feeling lonely', ja: 'さみしい' } },
  { id: 'family', kind: 'sad', sort: 60, active: true, labels: { vi: 'Chuyện gia đình', en: 'Family matters', ja: '家族のこと' } },
  { id: 'overwhelm', kind: 'sad', sort: 70, active: true, labels: { vi: 'Kiệt sức, quá tải', en: 'Exhausted, overwhelmed', ja: '疲れ果てて、もう限界' } },
  { id: 'anxiety', kind: 'sad', sort: 80, active: true, labels: { vi: 'Lo về tương lai', en: 'Worried about the future', ja: '将来への不安' } },
  { id: 'moved', kind: 'joy', sort: 90, active: true, labels: { vi: 'Vì vui, vì cảm động', en: 'Happy or touched', ja: 'うれしくて、感動して' } },
  { id: 'unknown', kind: 'unknown', sort: 100, active: true, labels: { vi: 'Không rõ vì sao', en: 'Not sure why', ja: '理由がわからない' } },
];

let list: Tag[] = TAGS_BUNDLED;

/** db.ts sets this from SQLite at startup and after each server refresh. */
export function setTagList(tags: Tag[]) {
  list = [...tags].sort((a, b) => a.sort - b.sort);
}

/**
 * What a form offers, in the admin's order: active Tags, plus any selected Tag hidden meanwhile (the
 * refresh can land while the form is open) so it stays visible and can be unselected.
 */
export const formTags = (selected: readonly string[]) =>
  list.filter((tag) => tag.active || selected.includes(tag.id));

export const findTag = (id: string) => list.find((tag) => tag.id === id);

/**
 * TagPicker's row (ADR 0009 §5): the `size` Tags this person picked most (`usage` = count per id from their
 * own Entries; ties and first use follow the admin `sort`), plus every selected Tag so a pick from the
 * sheet stays visible. `more`: some candidate is only in the sheet.
 */
export function quickTags(candidates: readonly Tag[], usage: Record<string, number>, selected: readonly string[], size = 6) {
  const row = [...candidates]
    .sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0) || a.sort - b.sort)
    .slice(0, size);
  for (const tag of candidates) if (selected.includes(tag.id) && !row.includes(tag)) row.push(tag);
  return { row, more: candidates.length > row.length };
}

/**
 * Only joy Tags: request_comfort() never falls back to `unknown` for them, so "no Comfort" needs the
 * joy wording.
 */
export const isJoyOnly = (ids: readonly string[]) =>
  ids.length > 0 && ids.every((id) => findTag(id)?.kind === 'joy');

/** Max 3 Tags per Entry, 2 per Comfort. Both have a matching CHECK in the migration. */
export const MAX_ENTRY_TAGS = 3;
export const MAX_COMFORT_TAGS = 2;

/**
 * No Tag selected ⇒ 'unknown', a real Tag (not an empty value) with its own Comforts in the pool.
 * Extra Tags are cut instead of rejected: someone who just cried should not be blocked by a
 * validation error.
 */
export function normalizeTags(picked: readonly string[]): string[] {
  const unique = [...new Set(picked)];
  return unique.length === 0 ? [UNKNOWN_TAG] : unique.slice(0, MAX_ENTRY_TAGS);
}
