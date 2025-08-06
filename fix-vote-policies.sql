-- Add missing UPDATE policy for confessions vote counts
-- Run this in Supabase SQL Editor

-- Allow anyone to update vote counts in confessions
CREATE POLICY "Anyone can update confession vote counts"
  ON confessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow anyone to update vote counts in comments  
CREATE POLICY "Anyone can update comment vote counts"
  ON comments
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
