-- Revoke direct EXECUTE on SECURITY DEFINER helpers; they are only meant to be
-- called from within RLS policies and triggers (which run with the function
-- definer's rights regardless of EXECUTE grants).
REVOKE EXECUTE ON FUNCTION public.is_session_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_session_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_session_referee(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_wargames_update_columns() FROM PUBLIC, anon, authenticated;
