-- The backup is end-to-end encrypted (docs/adr/0010-sync-entry.md): the server keeps one opaque `payload` per
-- Entry instead of readable columns. Changing this file means updating docs/db.md and app/src/sync.ts to match.

-- payload = hex(24-byte nonce || XChaCha20-Poly1305 ciphertext of the Entry as JSON). A tombstone keeps only
-- id + deleted_at. The old content columns must stay null: the check makes "nothing readable on the server"
-- a database rule. ponytail: the columns are kept (dropping needs a confirmed destructive migration); drop
-- them in a later migration.
alter table entries
  add column payload text,
  drop constraint entries_tombstone,
  add constraint entries_tombstone check (
    (deleted_at is null) = (payload is not null)
    and occurred_at is null and duration_min is null and intensity is null and tags is null
    and reflection is null and attachments is null);
