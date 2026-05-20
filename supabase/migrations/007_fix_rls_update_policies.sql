-- Fix conflicting UPDATE policies on matches table.
-- The old setup had two overlapping UPDATE policies:
--   1) "Anyone can join waiting matches" (USING status='waiting', CHECK status='active' AND player2_id=auth.uid())
--   2) "Players can update their own matches" (USING player1_id=auth.uid() OR player2_id=auth.uid())
-- When player2 joins, their ID isn't stored yet, so policy 2 fails for them,
-- and the OR-merge of both policies produces unpredictable results.
-- This replaces both with a single clear policy.

DROP POLICY IF EXISTS "Anyone can join waiting matches" ON matches;
DROP POLICY IF EXISTS "Players can update their own matches" ON matches;

-- Unified UPDATE policy:
-- A user can update a match if they are already a participant OR the match is still waiting (join scenario).
-- The WITH CHECK is permissive; business logic is enforced by RPCs (claim_private_match, update_match_progress).
CREATE POLICY "Players can update matches they participate in"
  ON matches FOR UPDATE
  USING (
    auth.uid() = player1_id
    OR auth.uid() = player2_id
    OR (status = 'waiting')
  )
  WITH CHECK (true);
