-- Tearnote initial schema. Source of truth: docs/db.md
-- Changing this file means updating docs/db.md and the app's SQLite schema to match.

create type tag as enum (
  'heartbreak','grief','pressure','self_worth','loneliness',
  'family','overwhelm','anxiety','moved','unknown');
create type lang as enum ('en','vi','ja');
create type comfort_status as enum ('pending','approved','rejected','retracted');

-- Anonymous Comforts, original text in the writer's language.
create table comforts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 20 and 500),
  source_lang lang not null,
  tags        tag[] not null check (array_length(tags, 1) between 1 and 2),
  status      comfort_status not null default 'pending',
  mod_note    text,
  created_at  timestamptz not null default now()
);
create index comforts_tags_idx on comforts using gin (tags) where status = 'approved';
create index comforts_status_created_idx on comforts (status, created_at);

create table comfort_translations (
  comfort_id uuid not null references comforts(id) on delete cascade,
  lang       lang not null,
  body       text not null,
  created_at timestamptz not null default now(),
  primary key (comfort_id, lang)
);

-- The primary key is the "never deliver twice" rule.
create table deliveries (
  comfort_id   uuid not null references comforts(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  thanked      boolean not null default false,
  primary key (comfort_id, recipient_id)
);
create index deliveries_recipient_idx on deliveries (recipient_id);

create table hotlines (
  id      uuid primary key default gen_random_uuid(),
  country text not null,                      -- ISO 3166-1 alpha-2
  name    text not null,
  phone   text,
  url     text,
  hours   text,
  sort    int not null default 0,
  check (phone is not null or url is not null)
);
create index hotlines_country_sort_idx on hotlines (country, sort);

-- Only for users who turned on sync. A copy of SQLite, not the source of truth.
create table entries (
  id           uuid primary key,             -- generated on the device
  user_id      uuid not null references auth.users(id) on delete cascade,
  occurred_at  timestamptz not null,
  duration_min int check (duration_min >= 0),
  intensity    smallint not null check (intensity between 1 and 5),
  tags         tag[] not null check (array_length(tags, 1) between 1 and 3),
  reflection   text,
  attachments  text[],
  created_at   timestamptz not null default now()
);
create index entries_user_occurred_idx on entries (user_id, occurred_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table comforts             enable row level security;
alter table comfort_translations enable row level security;
alter table deliveries           enable row level security;
alter table hotlines             enable row level security;
alter table entries              enable row level security;

-- Readers cannot select comforts ⇒ author_id never leaks.
create policy comfort_select_own on comforts for select to authenticated
  using (author_id = auth.uid());

-- Real accounts only, max 5 Comforts / 24h. Sliding window, not calendar days.
create policy comfort_insert on comforts for insert to authenticated
with check (
  author_id = auth.uid()
  and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and (select count(*) from comforts c
       where c.author_id = auth.uid()
         and c.created_at > now() - interval '24 hours') < 5
);

-- Retract: only a change to 'retracted' is allowed.
create policy comfort_retract on comforts for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and status = 'retracted');
revoke update on comforts from authenticated;
grant update (status) on comforts to authenticated;

-- comfort_translations: no one reads it, only the batch (service role) writes. No policies.

-- Read only rows where you are the recipient; only the thanked column can change.
create policy delivery_select_own on deliveries for select to authenticated
  using (recipient_id = auth.uid());
create policy delivery_thank on deliveries for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
revoke update on deliveries from authenticated;
grant update (thanked) on deliveries to authenticated;
-- No insert policy: only request_comfort() writes.

create policy hotline_read on hotlines for select to anon, authenticated using (true);

create policy entry_own on entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── The only read path into the pool ───────────────────────────────────────
create function request_comfort(p_tags tag[], p_lang lang)
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
      -- matching tag; otherwise fall back to 'unknown', except for 'moved' (see tags.md)
      and (c.tags && p_tags
           or (not ('moved' = any(p_tags)) and 'unknown' = any(c.tags)))
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

revoke all on function request_comfort(tag[], lang) from public;
grant execute on function request_comfort(tag[], lang) to authenticated;
