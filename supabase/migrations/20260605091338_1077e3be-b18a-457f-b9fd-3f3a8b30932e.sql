-- Add image_url column
ALTER TABLE public.mood_entries ADD COLUMN IF NOT EXISTS image_url text;

-- Admin check function (security definer, reads auth.users.email)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND email = 'admin@gmail.com'
  )
$$;

-- Admin RLS policies for full access
CREATE POLICY "Admins can view all entries"
  ON public.mood_entries FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all entries"
  ON public.mood_entries FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all entries"
  ON public.mood_entries FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));