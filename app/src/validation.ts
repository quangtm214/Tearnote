import { useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { z } from 'zod';

import { LANGS, t } from '@/i18n';
import { MAX_COMFORT_TAGS } from '@/tags';

// Must match Supabase Auth's "Minimum password length" setting.
// Changing these means editing `passwordTooShort` / `common.passwordHint` / `tagsTooMany` in all three dictionaries
// (6 / 6 / 2 are hardcoded there).
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

// No "repeat password" field: TextField `password` has an eye button to check what was typed.
export const registerForm = z.object({ email, password });
export const newPasswordForm = z.object({ password });

export const comfortDraft = z.object({
  body: z
    .string()
    .refine((s) => countChars(s) >= MIN_COMFORT_LENGTH, 'bodyTooShort')
    .refine((s) => countChars(s) <= MAX_COMFORT_LENGTH, 'bodyTooLong'),
  // Ids are checked by the server trigger check_tag_ids (ADR 0009), not here.
  tags: z.array(z.string()).min(1, 'tagsNone').max(MAX_COMFORT_TAGS, 'tagsTooMany'),
  sourceLang: z.enum(LANGS, 'langInvalid'),
});

// One row from the request_comfort RPC — a wrong shape is an error; never write it to SQLite.
export const comfortRows = z.array(z.object({ comfort_id: z.string(), body: z.string(), translated: z.boolean() }));

// One `select id, body, tags, status` row from the comforts table (comfort/mine.tsx).
export const myComfortRows = z.array(
  z.object({
    id: z.string(),
    body: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['pending', 'approved', 'rejected', 'retracted']),
  }),
);

// One `select id, kind, labels, sort, active` row from the tags table. `labels` is a plain string record:
// a language the server adds later must not make the row fail to parse.
export const tagRow = z.object({
  id: z.string(),
  kind: z.enum(['sad', 'joy', 'unknown']),
  labels: z.record(z.string(), z.string()),
  sort: z.number(),
  active: z.boolean(),
});

// The `help_fab_position` setting (ui.tsx, docs/db.md). Anything unreadable falls back to the default spot.
export const fabPosition = z
  .object({ side: z.enum(['left', 'right']), lift: z.number().min(0) })
  .catch({ side: 'right', lift: 0 });

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

/**
 * Field errors for a form. Quiet while the user types the first time; after the first submit the schema
 * re-runs on every render, so an error goes away as soon as the input is valid. Each field shows its own
 * first error, so every missing part is marked at once (DESIGN.md › Buttons: the primary is never disabled).
 * `messageOf` overrides the text of a code, e.g. to say how much is missing; the same text is announced.
 */
export function useFormCheck<T extends z.ZodType>(
  schema: T,
  input: z.input<T>,
  messageOf?: (field: keyof z.input<T> & string, code: ValidationCode) => string | undefined,
) {
  type Field = keyof z.input<T> & string;
  const [submitted, setSubmitted] = useState(false);
  const r = schema.safeParse(input);
  const issues = r.success ? [] : r.error.issues;
  const text = (field: Field, code: ValidationCode) => messageOf?.(field, code) ?? t.validation[code];
  return {
    errorOf: (field: Field) => {
      const issue = submitted ? issues.find((i) => i.path[0] === field) : undefined;
      return issue ? text(field, issue.message as ValidationCode) : null;
    },
    /** Parsed data, or the first failing field after announcing its error. */
    submit: (): { data: z.output<T> } | { field: Field } => {
      setSubmitted(true);
      if (r.success) return { data: r.data as z.output<T> };
      const field = String(issues[0].path[0]) as Field;
      AccessibilityInfo.announceForAccessibility(text(field, issues[0].message as ValidationCode));
      return { field };
    },
  };
}
