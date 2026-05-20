-- Atomic public match claiming — prevents race conditions
-- Two concurrent callers cannot claim the same match
CREATE OR REPLACE FUNCTION claim_public_match(pid UUID)
RETURNS SETOF matches
LANGUAGE plpgsql
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
    WHERE status = 'waiting' AND is_public = true
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
