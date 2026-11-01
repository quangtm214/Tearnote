-- Tags move from the `tag` enum to an admin-managed table. Decision: docs/adr/0009-tag-do-admin-quan-ly.md.
-- Changing this file means updating docs/db.md, docs/tags.md and the app's bundled list to match.

create type tag_kind as enum ('sad', 'joy', 'unknown');

create table tags (
  id     text primary key check (id ~ '^[a-z][a-z_]*$'),
  kind   tag_kind not null,
  labels jsonb not null,            -- {"vi": "...", "en": "...", "ja": "..."}; tags_guard checks every lang
  sort   int not null default 0,
  active boolean not null default true,
  -- 'unknown' is the only kind=unknown tag and can never be hidden: the app writes it for Entries
  -- with no Tag, and request_comfort falls back to it.
  check ((id = 'unknown') = (kind = 'unknown')),
  check (active or id <> 'unknown')
);

-- The admin edits this table in the Supabase dashboard as `postgres`, which skips RLS,
-- so the rules live in a trigger, not in policies.
create function tags_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $fn$
begin
  -- Ids live in Comforts on the server and in Entries on every device: hide a tag, never delete it.
  if tg_op = 'DELETE' then
    raise exception 'tag % cannot be deleted; set active = false instead', old.id;
  end if;
  if tg_op = 'UPDATE' and new.id <> old.id then
    raise exception 'tag id % cannot change', old.id;
  end if;
  -- enum_range keeps this rule in step when a lang is added: that migration must fill the labels.
  if exists (select 1 from unnest(enum_range(null::lang)) l
             where coalesce(btrim(new.labels ->> l::text), '') = '') then
    raise exception 'tag % needs a non-empty label for every lang', new.id;
  end if;
  return new;
end
$fn$;

create trigger tags_guard before insert or update or delete on tags
  for each row execute function tags_guard();

-- Labels copied verbatim from the old docs/tags.md list; the app bundles the same rows (TAGS_BUNDLED).
insert into tags (id, kind, sort, labels) values
  ('heartbreak', 'sad',      10, '{"vi": "Chuyện tình cảm", "en": "Love life", "ja": "恋愛のこと"}'),
  ('grief',      'sad',      20, '{"vi": "Mất người thân", "en": "Losing a loved one", "ja": "大切な人を亡くした"}'),
  ('pressure',   'sad',      30, '{"vi": "Áp lực công việc, học tập", "en": "Work or school pressure", "ja": "仕事や勉強のプレッシャー"}'),
  ('self_worth', 'sad',      40, '{"vi": "Thấy mình không đủ tốt", "en": "Feeling not good enough", "ja": "自分はダメだと感じる"}'),
  ('loneliness', 'sad',      50, '{"vi": "Cô đơn", "en": "Feeling lonely", "ja": "さみしい"}'),
  ('family',     'sad',      60, '{"vi": "Chuyện gia đình", "en": "Family matters", "ja": "家族のこと"}'),
  ('overwhelm',  'sad',      70, '{"vi": "Kiệt sức, quá tải", "en": "Exhausted, overwhelmed", "ja": "疲れ果てて、もう限界"}'),
  ('anxiety',    'sad',      80, '{"vi": "Lo về tương lai", "en": "Worried about the future", "ja": "将来への不安"}'),
  ('moved',      'joy',      90, '{"vi": "Vì vui, vì cảm động", "en": "Happy or touched", "ja": "うれしくて、感動して"}'),
  ('unknown',    'unknown', 100, '{"vi": "Không rõ vì sao", "en": "Not sure why", "ja": "理由がわからない"}');

alter table tags enable row level security;
-- No write policy: only the dashboard (postgres) and the service role write.
create policy tag_read on tags for select to anon, authenticated using (true);

-- text[] + trigger instead of a join table: request_comfort keeps `&&` and the GIN index, and a Comfort
-- stays a single insert under the comfort_insert policy (ADR 0009 §1).
alter table comforts alter column tags type text[] using tags::text[];
alter table entries  alter column tags type text[] using tags::text[];

-- Arrays have no foreign keys. Existence only, not `active`: synced Entries keep hidden tags,
-- and a Comfort from an app with a stale list should not fail.
create function check_tag_ids() returns trigger
language plpgsql set search_path = public, pg_temp as $fn$
begin
  if exists (select 1 from unnest(new.tags) x where not exists (select 1 from tags t where t.id = x)) then
    raise exception 'unknown tag in %', new.tags using errcode = 'foreign_key_violation';
  end if;
  return new;
end
$fn$;

create trigger comforts_check_tags before insert or update of tags on comforts
  for each row execute function check_tag_ids();
create trigger entries_check_tags before insert or update of tags on entries
  for each row execute function check_tag_ids();

-- Same function as 0001, with p_tags text[] and the fallback rule read from tags.kind.
drop function request_comfort(tag[], lang);

create function request_comfort(p_tags text[], p_lang lang)
returns table (comfort_id uuid, body text, translated boolean)
language sql security definer set search_path = public, pg_temp as $fn$
  with picked as (
    select c.id,
           coalesce(t.body, c.body) as body,
           t.comfort_id is not null as translated
    from comforts c
    left join comfort_translations t
      on t.comfort_id = c.id and t.lang = p_lang
    where c.status = 'approved'
      and c.author_id <> auth.uid()
      -- matching tag; otherwise fall back to 'unknown', unless the Entry has any joy tag (docs/tags.md)
      and (c.tags && p_tags
           or (not exists (select 1 from tags g where g.id = any(p_tags) and g.kind = 'joy')
               and 'unknown' = any(c.tags)))
      -- skip Comforts not yet available in the reader's language
      and (t.comfort_id is not null or c.source_lang = p_lang)
      and not exists (
        select 1 from deliveries d
        where d.comfort_id = c.id and d.recipient_id = auth.uid())
      -- max 3 Comforts received per 24h
      and (select count(*) from deliveries d2
           where d2.recipient_id = auth.uid()
             and d2.delivered_at > now() - interval '24 hours') < 3
    order by (c.tags && p_tags) desc, random()
    limit 1
  ), logged as (
    insert into deliveries (comfort_id, recipient_id)
    select id, auth.uid() from picked
    returning comfort_id
  )
  select id, body, translated from picked;
$fn$;

revoke all on function request_comfort(text[], lang) from public;
grant execute on function request_comfort(text[], lang) to authenticated;
-- Supabase grants execute to anon by default (see 0002).
revoke execute on function request_comfort(text[], lang) from anon;

drop type tag;
