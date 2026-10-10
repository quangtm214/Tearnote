import { z } from 'zod';

import { LANGS, type t } from '@/i18n';
import { MAX_COMFORT_TAGS, TAG_IDS } from '@/tags';

// Phải khớp cài đặt Minimum password length của Supabase Auth.
// Đổi các hằng số này thì sửa `passwordTooShort` / `tagsTooMany` ở ba từ điển (số 6 / 2 viết thẳng trong chữ).
export const MIN_PASSWORD = 6;
// Phải đổi cùng lúc với CHECK `char_length(body) between 20 and 500` và
// `array_length(tags,1) between 1 and 2` trong supabase/migrations/0001_init.sql.
export const MIN_COMFORT_LENGTH = 20;
export const MAX_COMFORT_LENGTH = 500;

/** Mã lỗi ổn định — chữ nằm ở `t.validation[code]`, màn tự tra lúc hiện. */
export type ValidationCode = keyof typeof t.validation;

// Đếm theo code point cho khớp char_length của Postgres — emoji là 1, không phải 2.
export const countChars = (s: string) => [...s.trim()].length;

// Cố ý lỏng: Supabase Auth mới là nơi quyết định, chặn nhầm ở đây thì người dùng không có đường nào khác.
const email = z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'emailInvalid');
const password = z.string().min(MIN_PASSWORD, 'passwordTooShort');

// Đăng nhập không áp MIN_PASSWORD: tài khoản tạo dưới mức tối thiểu cũ vẫn phải vào được.
export const loginForm = z.object({ email, password: z.string().min(1, 'passwordRequired') });

export const registerForm = z
  .object({ email, password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'passwordMismatch' });

export const comfortDraft = z.object({
  body: z
    .string()
    .refine((s) => countChars(s) >= MIN_COMFORT_LENGTH, 'bodyTooShort')
    .refine((s) => countChars(s) <= MAX_COMFORT_LENGTH, 'bodyTooLong'),
  tags: z.array(z.enum(TAG_IDS)).min(1, 'tagsNone').max(MAX_COMFORT_TAGS, 'tagsTooMany'),
  sourceLang: z.enum(LANGS, 'langInvalid'),
});

// Một dòng trả về từ RPC request_comfort — sai hình dạng thì coi như lỗi, đừng ghi vào SQLite.
export const comfortRows = z.array(z.object({ comfort_id: z.string(), body: z.string(), translated: z.boolean() }));

// Một dòng `select id, body, tags, status` từ bảng comforts ở màn "Lời mình đã viết".
export const myComfortRows = z.array(
  z.object({
    id: z.string(),
    body: z.string(),
    tags: z.array(z.enum(TAG_IDS)),
    status: z.enum(['pending', 'approved', 'rejected', 'retracted']),
  }),
);

/** Lỗi đầu tiên: ô nào + mã nào. */
export function check<T extends z.ZodType>(
  schema: T,
  input: unknown,
): { data: z.output<T> } | { field: string; code: ValidationCode } {
  const r = schema.safeParse(input);
  if (r.success) return { data: r.data as z.output<T> };
  const issue = r.error.issues[0];
  return { field: String(issue.path[0] ?? ''), code: issue.message as ValidationCode };
}
