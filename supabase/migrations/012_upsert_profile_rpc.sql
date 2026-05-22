-- Server-side upsert profile with auth.uid() enforcement.
-- Prevents users from creating/modifying profiles for other user IDs.
CREATE OR REPLACE FUNCTION upsert_profile(
  p_username TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_id UUID;
  result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if username is already taken by another user
  SELECT id INTO existing_id FROM public.profiles
  WHERE username = p_username AND id != auth.uid();

  IF FOUND THEN
    RAISE EXCEPTION 'Username is already taken' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.profiles (id, username, updated_at)
  VALUES (auth.uid(), p_username, now())
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      updated_at = now();

  SELECT jsonb_build_object(
    'id', auth.uid(),
    'username', p_username,
    'success', true
  ) INTO result;

  RETURN result;
END;
$$;
