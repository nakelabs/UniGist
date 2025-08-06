-- Add emoji reactions table
-- Run this in Supabase SQL Editor

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fingerprint text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('confession', 'comment')),
  target_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_fingerprint, target_type, target_id, emoji)
);

-- Enable Row Level Security
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policies for reactions (public read/write)
CREATE POLICY "Anyone can read reactions"
  ON reactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create reactions"
  ON reactions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their own reactions"
  ON reactions
  FOR DELETE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_fingerprint ON reactions(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_reactions_emoji ON reactions(emoji);

-- Function to get reaction counts for a confession
CREATE OR REPLACE FUNCTION get_confession_reactions(confession_id uuid)
RETURNS TABLE (emoji text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.emoji,
    COUNT(*) as count
  FROM reactions r
  WHERE r.target_type = 'confession' AND r.target_id = confession_id
  GROUP BY r.emoji
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get reaction counts for a comment
CREATE OR REPLACE FUNCTION get_comment_reactions(comment_id uuid)
RETURNS TABLE (emoji text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.emoji,
    COUNT(*) as count
  FROM reactions r
  WHERE r.target_type = 'comment' AND r.target_id = comment_id
  GROUP BY r.emoji
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;
