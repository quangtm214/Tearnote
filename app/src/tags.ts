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

/** Nhãn tiếng Việt. en/ja nằm trong docs/tags.md, thêm vào khi làm i18n. */
export const TAG_LABEL_VI: Record<TagId, string> = {
  heartbreak: 'Chia tay, thất tình',
  grief: 'Mất mát',
  pressure: 'Áp lực',
  self_worth: 'Tự trách mình',
  loneliness: 'Cô đơn',
  family: 'Gia đình',
  overwhelm: 'Kiệt sức',
  anxiety: 'Lo cho tương lai',
  moved: 'Xúc động',
  unknown: 'Không rõ vì sao',
};

/** Entry được gắn tối đa 3 tag. */
export const MAX_ENTRY_TAGS = 3;

/**
 * Không chọn tag nào thì rơi về 'unknown' — 'unknown' là tag thật, không phải giá trị rỗng,
 * và pool có Comfort gắn 'unknown' để trả về. Cắt thừa thay vì báo lỗi: người vừa khóc xong
 * không cần bị một thông báo validate chặn lại.
 */
export function normalizeTags(picked: readonly TagId[]): TagId[] {
  const unique = [...new Set(picked)];
  return unique.length === 0 ? ['unknown'] : unique.slice(0, MAX_ENTRY_TAGS);
}
