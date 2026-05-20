-- Atomic private match joining — prevents two players from claiming the same room.
-- Mirrors the existing claim_public_match pattern with FOR UPDATE SKIP LOCKED.
CREATE OR REPLACE FUNCTION claim_private_match(room_code TEXT, pid UUID)
RETURNS SETOF matches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claimed matches%ROWTYPE;
BEGIN
  UPDATE matches
  SET player2_id = pid,
      status = 'active',
      started_at = now()
  WHERE id = (
    SELECT id FROM matches
    WHERE id = room_code
      AND status = 'waiting'
      AND player2_id IS NULL
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed;

  IF FOUND THEN
    RETURN NEXT claimed;
  END IF;

  RETURN;
END;
$$;
