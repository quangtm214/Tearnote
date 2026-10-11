import { z } from 'zod';

import { LANGS, type t } from '@/i18n';
import { MAX_COMFORT_TAGS, TAG_IDS } from '@/tags';

// Must match Supabase Auth's "Minimum password length" setting.
// Changing these means editing `passwordTooShort` / `tagsTooMany` in all three dictionaries (6 / 2 are hardcoded there).
export const MIN_PASSWORD = 6;
// Change together with CHECK `char_length(body) between 20 and 500` and
// `array_length(tags,1) between 1 and 2` in supabase/migrations/0001_init.sql.
export const MIN_COMFORT_LENGTH = 20;
export const MAX_COMFORT_LENGTH = 500;

/** Stable error codes; the text lives in `t.validation[code]`, looked up by the screen. */
export type ValidationCode = keyof typeof t.validation;

// Count code points to match Postgres char_length — an emoji is 1, not 2.
export const countChars = (s: string) => [...s.trim()].length;

// Deliberately loose: Supabase Auth decides; a false reject here would leave the user no way around it.
const email = z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'emailInvalid');
const password = z.string().min(MIN_PASSWORD, 'passwordTooShort');

// Login skips MIN_PASSWORD: accounts created under an older, lower minimum must still get in.
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

// One row from the request_comfort RPC — a wrong shape is an error; never write it to SQLite.
export const comfortRows = z.array(z.object({ comfort_id: z.string(), body: z.string(), translated: z.boolean() }));

// One `select id, body, tags, status` row from the comforts table (comfort/mine.tsx).
export const myComfortRows = z.array(
  z.object({
    id: z.string(),
    body: z.string(),
    tags: z.array(z.enum(TAG_IDS)),
    status: z.enum(['pending', 'approved', 'rejected', 'retracted']),
  }),
);

/** First error: which field + which code. */
export function check<T extends z.ZodType>(
  schema: T,
  input: unknown,
): { data: z.output<T> } | { field: string; code: ValidationCode } {
  const r = schema.safeParse(input);
  if (r.success) return { data: r.data as z.output<T> };
  const issue = r.error.issues[0];
  return { field: String(issue.path[0] ?? ''), code: issue.message as ValidationCode };
}
