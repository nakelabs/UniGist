-- Debug script to check current database state
-- Run this in Supabase SQL Editor to see what data exists

-- Check confessions
SELECT 'CONFESSIONS:' as table_name, COUNT(*) as count FROM confessions;
SELECT id, LEFT(content, 50) as content_preview, created_at FROM confessions ORDER BY created_at DESC LIMIT 3;

-- Check comments
SELECT 'COMMENTS:' as table_name, COUNT(*) as count FROM comments;

-- Check votes  
SELECT 'VOTES:' as table_name, COUNT(*) as count FROM votes;

-- Check reactions
SELECT 'REACTIONS:' as table_name, COUNT(*) as count FROM reactions;

-- Check reports
SELECT 'REPORTS:' as table_name, COUNT(*) as count FROM reports;
SELECT id, target_type, reason, custom_reason, status, created_at FROM reports ORDER BY created_at DESC LIMIT 5;

-- Test the delete_all_data function (check if it exists)
SELECT 'TESTING FUNCTION EXISTENCE:' as test;
SELECT EXISTS(
    SELECT 1 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'delete_all_data'
) as function_exists;

-- Check RLS policies
SELECT 'RLS POLICIES:' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('confessions', 'comments', 'votes', 'reactions', 'reports')
ORDER BY tablename, policyname;
