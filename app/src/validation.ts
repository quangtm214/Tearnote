import { z } from 'zod';

import { LANGS, type t } from '@/i18n';
import { MAX_COMFORT_TAGS, TAG_IDS } from '@/tags';

// Phải khớp cài đặt Minimum password length của Supabase Auth.
export const MIN_PASSWORD = 6;
// Phải đổi cùng lúc với CHECK `char_length(body) between 20 and 500` và
// `array_length(tags,1) between 1 and 2` trong supabase/migrations/0001_init.sql.
export const MIN_COMFORT_LENGTH = 20;
export const MAX_COMFORT_LENGTH = 500;

/** Mã lỗi ổn định — chữ nằm ở `t.validation[code]`, màn tự tra lúc hiện. */
export type ValidationCode = keyof typeof t.validation;

// Đếm theo code point cho khớp char_length của Postgres — emoji là 1, không phải 2.
export const countChars = (s: string) => [...s.trim()].length;

const email = z.string().trim().pipe(z.email('emailInvalid'));
const password = z.string().min(MIN_PASSWORD, 'passwordTooShort');

export const loginForm = z.object({ email, password });

export const registerForm = loginForm
  .extend({ confirm: z.string() })
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
