
-- Supabase grants execute to anon by default. Without login auth.uid() is null, so the function
-- returns nothing anyway — but letting anon call a security definer is needless attack surface.
revoke execute on function request_comfort(tag[], lang) from anon;
