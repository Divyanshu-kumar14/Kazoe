-- Lightweight per-user rate limiting for RPCs.
-- Uses a simple table with minute-granularity windows and self-cleaning reads.

-- Create rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL,
  rpc_name TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  call_count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, rpc_name, window_start)
);

-- Helper function: check + increment rate limit atomically.
-- Returns true if under the limit, false if exceeded.
-- Cleans up stale entries older than the window on each call.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_rpc_name TEXT,
  p_max_calls INT DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  ws TIMESTAMPTZ;
  cc INT;
BEGIN
  -- Truncate to minute for the rate limit window
  ws := date_trunc('minute', now());

  -- Self-cleaning: delete entries older than 1 minute to keep the table small
  DELETE FROM rate_limits WHERE window_start < ws;

  -- Insert or increment
  INSERT INTO rate_limits (user_id, rpc_name, window_start, call_count)
  VALUES (p_user_id, p_rpc_name, ws, 1)
  ON CONFLICT (user_id, rpc_name, window_start)
  DO UPDATE SET call_count = rate_limits.call_count + 1
  RETURNING call_count INTO cc;

  RETURN cc <= p_max_calls;
END;
$$;

-- Integrate rate limiting into all multiplayer RPCs.

-- === update_match_progress: 60 calls / minute ===

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
  uid UUID;
BEGIN
  uid := auth.uid();

  -- Rate limit: max 60 calls per minute per user
  IF NOT check_rate_limit(uid, 'update_match_progress', 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please slow down.';
  END IF;

  -- Verify caller is one of the players in the match
  IF NOT EXISTS (
    SELECT 1 FROM matches
    WHERE id = match_id
      AND (player1_id = uid OR player2_id = uid)
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF player_num NOT IN (1, 2) THEN
    RAISE EXCEPTION 'player_num must be 1 or 2';
  END IF;

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

-- === claim_private_match: 30 calls / minute ===

CREATE OR REPLACE FUNCTION claim_private_match(room_code TEXT, pid UUID)
RETURNS SETOF matches
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claimed matches%ROWTYPE;
  uid UUID;
BEGIN
  uid := auth.uid();

  IF NOT check_rate_limit(uid, 'claim_private_match', 30) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please slow down.';
  END IF;

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
      AND player1_id != pid
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

-- === finalize_match: 10 calls / minute ===

CREATE OR REPLACE FUNCTION finalize_match(match_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  m RECORD;
  p1_score INT;
  p2_score INT;
  p1_attempts INT;
  p2_attempts INT;
  p1_accuracy NUMERIC;
  p2_accuracy NUMERIC;
  p1_time NUMERIC;
  p2_time NUMERIC;
  result_winner UUID;
  decided_by TEXT;
  points_winner INT := 50;
  points_draw INT := 25;
  points_loser INT := 10;
  uid UUID;
BEGIN
  uid := auth.uid();

  IF NOT check_rate_limit(uid, 'finalize_match', 10) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please slow down.';
  END IF;

  SELECT * INTO m FROM matches WHERE id = match_id FOR UPDATE;

  IF m IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF m.status = 'finished' THEN
    RETURN jsonb_build_object(
      'winner_id', m.winner_id,
      'already_finished', true,
      'scores', m.scores
    );
  END IF;

  IF uid IS NOT NULL AND m.player1_id != uid AND m.player2_id != uid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  p1_score := COALESCE((m.scores->>'player1')::int, 0);
  p2_score := COALESCE((m.scores->>'player2')::int, 0);
  p1_attempts := COALESCE(jsonb_array_length(m.scores->'player1_answers'), 0);
  p2_attempts := COALESCE(jsonb_array_length(m.scores->'player2_answers'), 0);

  SELECT COALESCE(SUM((elem->>'timeTaken')::numeric), 0)
  INTO p1_time
  FROM jsonb_array_elements(COALESCE(m.scores->'player1_answers', '[]'::jsonb)) AS elem
  WHERE (elem->>'isCorrect')::boolean = true;

  SELECT COALESCE(SUM((elem->>'timeTaken')::numeric), 0)
  INTO p2_time
  FROM jsonb_array_elements(COALESCE(m.scores->'player2_answers', '[]'::jsonb)) AS elem
  WHERE (elem->>'isCorrect')::boolean = true;

  result_winner := NULL;
  decided_by := 'draw';

  IF p1_score > p2_score THEN
    result_winner := m.player1_id;
    decided_by := 'correct_count';
  ELSIF p2_score > p1_score THEN
    result_winner := m.player2_id;
    decided_by := 'correct_count';
  ELSE
    p1_accuracy := CASE WHEN p1_attempts > 0 THEN p1_score::numeric / p1_attempts ELSE 0 END;
    p2_accuracy := CASE WHEN p2_attempts > 0 THEN p2_score::numeric / p2_attempts ELSE 0 END;

    IF p1_accuracy > p2_accuracy THEN
      result_winner := m.player1_id;
      decided_by := 'accuracy';
    ELSIF p2_accuracy > p1_accuracy THEN
      result_winner := m.player2_id;
      decided_by := 'accuracy';
    ELSE
      IF p1_attempts > 0 AND p2_attempts > 0 THEN
        IF p1_attempts < p2_attempts THEN
          result_winner := m.player1_id;
          decided_by := 'efficiency';
        ELSIF p2_attempts < p1_attempts THEN
          result_winner := m.player2_id;
          decided_by := 'efficiency';
        ELSE
          IF p1_score > 0 AND p2_score > 0 THEN
            IF p1_time < p2_time THEN
              result_winner := m.player1_id;
              decided_by := 'speed';
            ELSIF p2_time < p1_time THEN
              result_winner := m.player2_id;
              decided_by := 'speed';
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  UPDATE matches
  SET status = 'finished',
      winner_id = result_winner,
      scores = COALESCE(m.scores, '{}'::jsonb) || jsonb_build_object('decided_by', decided_by)
  WHERE id = match_id;

  IF result_winner IS NULL THEN
    UPDATE profiles SET points = points + points_draw WHERE id = m.player1_id;
    UPDATE profiles SET points = points + points_draw WHERE id = m.player2_id;
  ELSIF result_winner = m.player1_id THEN
    UPDATE profiles SET points = points + points_winner WHERE id = m.player1_id;
    UPDATE profiles SET points = points + points_loser WHERE id = m.player2_id;
  ELSE
    UPDATE profiles SET points = points + points_winner WHERE id = m.player2_id;
    UPDATE profiles SET points = points + points_loser WHERE id = m.player1_id;
  END IF;

  RETURN jsonb_build_object(
    'winner_id', result_winner,
    'decided_by', decided_by,
    'already_finished', false,
    'p1_score', p1_score,
    'p2_score', p2_score,
    'p1_attempts', p1_attempts,
    'p2_attempts', p2_attempts
  );
END;
$$;
