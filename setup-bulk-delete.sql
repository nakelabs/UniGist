-- Bulk delete function for admin panel
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION delete_all_data()
RETURNS TABLE(deleted_confessions INTEGER, deleted_comments INTEGER, deleted_votes INTEGER, deleted_reactions INTEGER, deleted_reports INTEGER) AS $$
DECLARE
    conf_count INTEGER := 0;
    comm_count INTEGER := 0;
    vote_count INTEGER := 0;
    react_count INTEGER := 0;
    rep_count INTEGER := 0;
BEGIN
    -- Get counts before deletion
    SELECT COUNT(*) INTO conf_count FROM confessions;
    SELECT COUNT(*) INTO comm_count FROM comments;
    SELECT COUNT(*) INTO vote_count FROM votes;
    SELECT COUNT(*) INTO react_count FROM reactions;
    SELECT COUNT(*) INTO rep_count FROM reports;
    
    -- Delete all data in correct order
    DELETE FROM reports;
    DELETE FROM reactions;
    DELETE FROM votes;
    DELETE FROM comments;
    DELETE FROM confessions;
    
    -- Return the counts of deleted items
    RETURN QUERY SELECT conf_count, comm_count, vote_count, react_count, rep_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting all data: %', SQLERRM;
        RETURN QUERY SELECT 0, 0, 0, 0, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_all_data() TO public;
