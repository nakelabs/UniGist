-- Alternative: Create a SQL function to calculate vote counts dynamically
-- This is more reliable than manually updating counters
-- Run this in Supabase SQL Editor

-- Function to get vote counts for a confession
CREATE OR REPLACE FUNCTION get_confession_vote_counts(confession_id uuid)
RETURNS TABLE (upvotes bigint, downvotes bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
    COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
  FROM votes 
  WHERE target_type = 'confession' AND target_id = confession_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get vote counts for a comment  
CREATE OR REPLACE FUNCTION get_comment_vote_counts(comment_id uuid)
RETURNS TABLE (upvotes bigint, downvotes bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
    COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
  FROM votes 
  WHERE target_type = 'comment' AND target_id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Test the function
-- SELECT * FROM get_confession_vote_counts('0379e1e2-baaf-4fcc-a8e7-f0e78fd8dd36');
