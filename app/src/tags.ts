import type { Lang } from './i18n';

/**
 * Contract Tag. Nguồn sự thật: docs/tags.md và enum `tag` trong Postgres.
 * Ba chỗ này phải khớp — sửa một thì sửa cả ba. Đừng thêm/bớt mà không hỏi.
 *
 * Tag mô tả HOÀN CẢNH, không mô tả mức độ cảm xúc (đã có thanh cường độ 1–5).
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
 * Nhãn theo ngôn ngữ — phải trùng các cột vi/en/ja trong docs/tags.md (tags.test.ts kiểm). Nhãn
 * quyết định người viết và người nhận hiểu Tag giống nhau, nên nó là một phần của cơ chế match chứ
 * không chỉ là chữ trên nút: en/ja dịch theo NGHĨA của cột vi, không dịch theo id.
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

/** Entry được gắn tối đa 3 tag, Comfort tối đa 2. Cả hai đều có CHECK tương ứng trong migration. */
export const MAX_ENTRY_TAGS = 3;
export const MAX_COMFORT_TAGS = 2;

/**
 * Không chọn tag nào thì rơi về 'unknown' — 'unknown' là tag thật, không phải giá trị rỗng,
 * và pool có Comfort gắn 'unknown' để trả về. Cắt thừa thay vì báo lỗi: người vừa khóc xong
 * không cần bị một thông báo validate chặn lại.
 */
export function normalizeTags(picked: readonly TagId[]): TagId[] {
  const unique = [...new Set(picked)];
  return unique.length === 0 ? ['unknown'] : unique.slice(0, MAX_ENTRY_TAGS);
}
