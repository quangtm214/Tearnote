-- Write surface of the nightly batch (ADR 0011, docs/db.md › Batch đêm). The routine follows
-- supabase/batch/nightly.md and writes only through these two functions, so a confused or
-- prompt-injected run cannot touch any other row or column.

-- Reason codes must match supabase/batch/nightly.md and docs/db.md.
create function batch_moderate(p_id uuid, p_decision text, p_reason text default null)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  if p_decision not in ('approve', 'reject', 'flag') then
    raise exception 'unknown decision: %', p_decision;
  end if;
  if p_decision <> 'approve' and not coalesce(p_reason = any (array[
      'self_harm', 'hate', 'sexual', 'contact', 'medical', 'spam', 'injection', 'off_topic', 'unsure']), false)
  then
    raise exception 'unknown reason: %', p_reason;
  end if;

  -- Only rows nobody has looked at yet: a flagged row (mod_note set) waits for the admin,
  -- and a row the author retracted is no longer pending.
  update comforts
     set status   = case p_decision when 'approve' then 'approved' when 'reject' then 'rejected'
                                    else 'pending' end::comfort_status,
         mod_note = case p_decision when 'approve' then null when 'reject' then 'batch: ' || p_reason
                                    else 'flag: ' || p_reason end
   where id = p_id and status = 'pending' and mod_note is null;
  return found;
end;
$fn$;

create function batch_translate(p_id uuid, p_lang lang, p_body text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  -- 1000 = twice the comforts.body maximum; a translation can run longer than its source.
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 1000 then
    raise exception 'translation length out of range';
  end if;

  insert into comfort_translations (comfort_id, lang, body)
  select id, p_lang, btrim(p_body) from comforts
   where id = p_id and status = 'approved' and source_lang <> p_lang
  on conflict do nothing;
  return found;
end;
$fn$;

-- Supabase grants execute on new public functions to anon and authenticated by default.
revoke all on function batch_moderate(uuid, text, text) from public, anon, authenticated;
revoke all on function batch_translate(uuid, lang, text) from public, anon, authenticated;
