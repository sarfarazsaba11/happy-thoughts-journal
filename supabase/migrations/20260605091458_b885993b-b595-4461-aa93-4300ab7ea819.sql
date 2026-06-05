CREATE OR REPLACE FUNCTION public.admin_list_entries()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  mood text,
  note text,
  image_url text,
  is_public boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT e.id, e.user_id, u.email::text, e.mood, e.note, e.image_url, e.is_public, e.created_at
    FROM public.mood_entries e
    LEFT JOIN auth.users u ON u.id = e.user_id
    ORDER BY e.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_user_count()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT count(*) INTO c FROM auth.users;
  RETURN c;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_entries() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_entries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_count() TO authenticated;