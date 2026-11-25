-- Entry sync: the server copy of a real account's journal. Decision: docs/adr/0010-sync-entry.md.
-- Changing this file means updating docs/db.md and the app's SQLite schema (app/src/db.ts) to match.

-- A deleted Entry stays as a tombstone (id + deleted_at, every other field wiped) so other devices of the
-- same account delete it too. The check makes the wipe a database rule, not an app promise.
alter table entries
  alter column occurred_at drop not null,
  alter column intensity drop not null,
  alter column tags drop not null,
  add column deleted_at timestamptz,
  add constraint entries_tombstone check (
    case when deleted_at is null
      then occurred_at is not null and intensity is not null and tags is not null
      else occurred_at is null and intensity is null and tags is null and duration_min is null
           and reflection is null and attachments is null
    end);

-- [{"id": "<attachment id>", "kind": "image" | "audio", "path": "<user id>/<entry id>/<file>"}] in display
-- order. Was text[] of paths, which loses the kind. The table holds no rows yet, so the cast moves nothing.
alter table entries alter column attachments type jsonb using to_jsonb(attachments);

-- Sync needs a real account (docs/db.md › Về "tài khoản"); anonymous users are `authenticated` too.
alter policy entry_own on entries
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- Photos and recordings. Private: files are read through short-lived signed URLs.
-- 25 MB per file: a 5-minute recording or one camera photo is well under it.
insert into storage.buckets (id, name, public, file_size_limit)
values ('entry-attachments', 'entry-attachments', false, 26214400)
on conflict (id) do nothing;

-- Each account owns the folder named after its user id.
create policy entry_files_own on storage.objects for all to authenticated
  using (bucket_id = 'entry-attachments'
         and (storage.foldername(name))[1] = auth.uid()::text
         and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (bucket_id = 'entry-attachments'
              and (storage.foldername(name))[1] = auth.uid()::text
              and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
