-- Replace full RLS disable with proper policies for anonymous auth

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create matches"
  ON matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can view their matches"
  ON matches FOR SELECT
  USING (
    auth.uid() = player1_id
    OR auth.uid() = player2_id
    OR (is_public = true AND status = 'waiting')
  );

CREATE POLICY "Anyone can join waiting matches"
  ON matches FOR UPDATE
  USING (status = 'waiting')
  WITH CHECK (
    status = 'active'
    AND player2_id = auth.uid()
  );

CREATE POLICY "Players can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Creator can delete matches"
  ON matches FOR DELETE
  USING (auth.uid() = player1_id);
