-- Drop the old function first if we are replacing it, though CREATE OR REPLACE is sufficient for body changes.
-- We are just rewriting it to include the point updating logic.

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
BEGIN
  -- Lock the row to prevent concurrent writes
  SELECT * INTO m FROM matches WHERE id = match_id FOR UPDATE;

  IF m IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Idempotent: if already finished, return existing result
  IF m.status = 'finished' THEN
    RETURN jsonb_build_object(
      'winner_id', m.winner_id,
      'already_finished', true,
      'scores', m.scores
    );
  END IF;

  -- Verify caller is a participant
  IF auth.uid() IS NOT NULL AND m.player1_id != auth.uid() AND m.player2_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Read canonical scores from DB
  p1_score := COALESCE((m.scores->>'player1')::int, 0);
  p2_score := COALESCE((m.scores->>'player2')::int, 0);
  p1_attempts := COALESCE(jsonb_array_length(m.scores->'player1_answers'), 0);
  p2_attempts := COALESCE(jsonb_array_length(m.scores->'player2_answers'), 0);

  -- Calculate total time spent on CORRECT answers only (sum of timeTaken where isCorrect=true)
  SELECT COALESCE(SUM((elem->>'timeTaken')::numeric), 0)
  INTO p1_time
  FROM jsonb_array_elements(COALESCE(m.scores->'player1_answers', '[]'::jsonb)) AS elem
  WHERE (elem->>'isCorrect')::boolean = true;

  SELECT COALESCE(SUM((elem->>'timeTaken')::numeric), 0)
  INTO p2_time
  FROM jsonb_array_elements(COALESCE(m.scores->'player2_answers', '[]'::jsonb)) AS elem
  WHERE (elem->>'isCorrect')::boolean = true;

  -- Tiebreaker cascade
  result_winner := NULL;
  decided_by := 'draw';

  -- 1. Correct count
  IF p1_score > p2_score THEN
    result_winner := m.player1_id;
    decided_by := 'correct_count';
  ELSIF p2_score > p1_score THEN
    result_winner := m.player2_id;
    decided_by := 'correct_count';
  ELSE
    -- 2. Accuracy (correct / attempts)
    p1_accuracy := CASE WHEN p1_attempts > 0 THEN p1_score::numeric / p1_attempts ELSE 0 END;
    p2_accuracy := CASE WHEN p2_attempts > 0 THEN p2_score::numeric / p2_attempts ELSE 0 END;

    IF p1_accuracy > p2_accuracy THEN
      result_winner := m.player1_id;
      decided_by := 'accuracy';
    ELSIF p2_accuracy > p1_accuracy THEN
      result_winner := m.player2_id;
      decided_by := 'accuracy';
    ELSE
      -- 3. Fewer attempts (rewards efficiency)
      -- Both 0 attempts = true draw
      IF p1_attempts > 0 AND p2_attempts > 0 THEN
        IF p1_attempts < p2_attempts THEN
          result_winner := m.player1_id;
          decided_by := 'efficiency';
        ELSIF p2_attempts < p1_attempts THEN
          result_winner := m.player2_id;
          decided_by := 'efficiency';
        ELSE
          -- 4. Speed (lower total time on correct answers wins)
          IF p1_score > 0 AND p2_score > 0 THEN
            IF p1_time < p2_time THEN
              result_winner := m.player1_id;
              decided_by := 'speed';
            ELSIF p2_time < p1_time THEN
              result_winner := m.player2_id;
              decided_by := 'speed';
            END IF;
            -- else: truly equal → draw
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Atomically update the match
  UPDATE matches
  SET status = 'finished',
      winner_id = result_winner,
      scores = COALESCE(m.scores, '{}'::jsonb) || jsonb_build_object('decided_by', decided_by)
  WHERE id = match_id;

  -- Update profiles with points
  IF result_winner IS NULL THEN
    -- Draw
    UPDATE profiles SET points = points + points_draw WHERE id = m.player1_id;
    UPDATE profiles SET points = points + points_draw WHERE id = m.player2_id;
  ELSIF result_winner = m.player1_id THEN
    -- P1 wins
    UPDATE profiles SET points = points + points_winner WHERE id = m.player1_id;
    UPDATE profiles SET points = points + points_loser WHERE id = m.player2_id;
  ELSE
    -- P2 wins
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
