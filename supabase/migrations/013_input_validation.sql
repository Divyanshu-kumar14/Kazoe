-- Fix two security gaps:

-- 1. Prevent self-join in claim_private_match (creator could claim as player2)
-- 2. Validate room code format before querying
-- 3. Add bounds checks to update_match_progress

-- === claim_private_match: prevent self-join + validate format ===

CREATE OR REPLACE FUNCTION claim_private_match(room_code TEXT, pid UUID)
RETURNS SETOF matches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claimed matches%ROWTYPE;
BEGIN
  -- Validate room code format (6 chars from the allowed alphabet)
  IF room_code !~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' THEN
    RAISE EXCEPTION 'Invalid room code format';
  END IF;

  UPDATE matches
  SET player2_id = pid,
      status = 'active',
      started_at = now()
  WHERE id = (
    SELECT id FROM matches
    WHERE id = room_code
      AND status = 'waiting'
      AND player2_id IS NULL
      AND player1_id != pid  -- prevent self-join
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

-- === update_match_progress: add input validation ===

CREATE OR REPLACE FUNCTION update_match_progress(
  match_id TEXT,
  player_num INT,
  player_score INT,
  answers JSONB,
  player_done BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_score INT;
BEGIN
  -- Verify caller is one of the players in the match
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate player number
  IF player_num NOT IN (1, 2) THEN
    RAISE EXCEPTION 'player_num must be 1 or 2';
  END IF;

  -- Validate score bounds: must be non-negative and ≤ question count
  SELECT COALESCE(jsonb_array_length(questions), 0) INTO max_score
  FROM matches WHERE id = match_id;

  IF player_score < 0 OR player_score > max_score THEN
    RAISE EXCEPTION 'player_score (%) out of range (0 to %)', player_score, max_score;
  END IF;

  IF player_num = 1 THEN
    UPDATE matches
    SET scores = COALESCE(scores, '{}'::jsonb) || jsonb_build_object(
      'player1', player_score,
      'player1_answers', answers,
      'player1_done', player_done
    )
    WHERE id = match_id;
  ELSE
    UPDATE matches
    SET scores = COALESCE(scores, '{}'::jsonb) || jsonb_build_object(
      'player2', player_score,
      'player2_answers', answers,
      'player2_done', player_done
    )
    WHERE id = match_id;
  END IF;
END;
$$;
