-- Setup CASCADE DELETE policies and functions for proper content deletion
-- Run this in Supabase SQL Editor

-- First, let's create a function to delete a confession and all related data
CREATE OR REPLACE FUNCTION delete_confession_cascade(confession_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    comment_ids UUID[];
BEGIN
    -- Get all comment IDs for this confession
    SELECT ARRAY(SELECT id FROM comments WHERE confession_id = confession_id_param) INTO comment_ids;
    
    -- Delete votes on comments
    IF array_length(comment_ids, 1) > 0 THEN
        DELETE FROM votes 
        WHERE target_type = 'comment' 
        AND target_id = ANY(comment_ids);
        
        -- Delete reactions on comments
        DELETE FROM reactions 
        WHERE target_type = 'comment' 
        AND target_id = ANY(comment_ids);
        
        -- Delete reports on comments
        DELETE FROM reports 
        WHERE target_type = 'comment' 
        AND target_id = ANY(comment_ids);
    END IF;
    
    -- Delete comments themselves
    DELETE FROM comments WHERE confession_id = confession_id_param;
    
    -- Delete votes on the confession
    DELETE FROM votes 
    WHERE target_type = 'confession' 
    AND target_id = confession_id_param;
    
    -- Delete reactions on the confession
    DELETE FROM reactions 
    WHERE target_type = 'confession' 
    AND target_id = confession_id_param;
    
    -- Delete reports on the confession
    DELETE FROM reports 
    WHERE target_type = 'confession' 
    AND target_id = confession_id_param;
    
    -- Finally delete the confession itself
    DELETE FROM confessions WHERE id = confession_id_param;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting confession: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a comment and all related data
CREATE OR REPLACE FUNCTION delete_comment_cascade(comment_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete votes on the comment
    DELETE FROM votes 
    WHERE target_type = 'comment' 
    AND target_id = comment_id_param;
    
    -- Delete reactions on the comment
    DELETE FROM reactions 
    WHERE target_type = 'comment' 
    AND target_id = comment_id_param;
    
    -- Delete reports on the comment
    DELETE FROM reports 
    WHERE target_type = 'comment' 
    AND target_id = comment_id_param;
    
    -- Delete the comment itself
    DELETE FROM comments WHERE id = comment_id_param;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting comment: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old confessions (older than specified days)
CREATE OR REPLACE FUNCTION clean_old_confessions(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    old_confession_ids UUID[];
    deleted_count INTEGER := 0;
    confession_id UUID;
BEGIN
    -- Get IDs of old confessions
    SELECT ARRAY(
        SELECT id FROM confessions 
        WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    ) INTO old_confession_ids;
    
    -- Delete each old confession using our cascade function
    IF array_length(old_confession_ids, 1) > 0 THEN
        FOREACH confession_id IN ARRAY old_confession_ids
        LOOP
            IF delete_confession_cascade(confession_id) THEN
                deleted_count := deleted_count + 1;
            END IF;
        END LOOP;
    END IF;
    
    RETURN deleted_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning old confessions: %', SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the new functions (allow public access for admin operations)
-- Note: These policies may conflict with existing ones, so we'll drop and recreate

-- Drop existing DELETE policies if they exist
DROP POLICY IF EXISTS "Allow public access to delete functions" ON confessions;
DROP POLICY IF EXISTS "Allow public access to delete comment functions" ON comments;
DROP POLICY IF EXISTS "Allow public access to delete vote functions" ON votes;
DROP POLICY IF EXISTS "Allow public access to delete reaction functions" ON reactions;
DROP POLICY IF EXISTS "Allow public access to delete report functions" ON reports;

-- Create permissive DELETE policies
CREATE POLICY "Admin delete access" ON confessions
    FOR DELETE
    TO public
    USING (true);

CREATE POLICY "Admin delete access" ON comments
    FOR DELETE
    TO public
    USING (true);

CREATE POLICY "Admin delete access" ON votes
    FOR DELETE
    TO public
    USING (true);

CREATE POLICY "Admin delete access" ON reactions
    FOR DELETE
    TO public
    USING (true);

CREATE POLICY "Admin delete access" ON reports
    FOR DELETE
    TO public
    USING (true);

-- Test the functions with some debug output
-- First, let's see what confessions we have:
SELECT 'Available confessions:' as debug_info;
SELECT id, content, created_at FROM confessions ORDER BY created_at DESC LIMIT 5;

-- Test clean function (should return 0 if no old confessions)
SELECT 'Testing clean function:' as debug_info;
SELECT clean_old_confessions(30) as cleaned_count; -- 30 days to test

-- Grant execute permissions to public
GRANT EXECUTE ON FUNCTION delete_confession_cascade(UUID) TO public;
GRANT EXECUTE ON FUNCTION delete_comment_cascade(UUID) TO public;
GRANT EXECUTE ON FUNCTION clean_old_confessions(INTEGER) TO public;
