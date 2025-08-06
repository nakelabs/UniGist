-- Test script for cascade delete functions
-- Run this AFTER running setup-cascade-deletes.sql

-- 1. First, let's see what data we have
SELECT 'Current confessions count:' as info, COUNT(*) as count FROM confessions;
SELECT 'Current comments count:' as info, COUNT(*) as count FROM comments;
SELECT 'Current votes count:' as info, COUNT(*) as count FROM votes;
SELECT 'Current reactions count:' as info, COUNT(*) as count FROM reactions;
SELECT 'Current reports count:' as info, COUNT(*) as count FROM reports;

-- 2. Show recent confessions with their IDs
SELECT 
    'Recent confessions:' as info,
    id,
    LEFT(content, 50) as content_preview,
    created_at
FROM confessions 
ORDER BY created_at DESC 
LIMIT 3;

-- 3. Test the clean function (this should be safe - adjust days as needed)
SELECT 'Testing clean old confessions (30+ days):' as info;
SELECT clean_old_confessions(30) as deleted_count;

-- 4. If you want to test individual deletion, uncomment and replace with actual ID:
-- SELECT 'Testing individual confession deletion:' as info;
-- SELECT delete_confession_cascade('replace-with-actual-confession-id');

-- 5. Check counts after cleanup
SELECT 'After cleanup - confessions count:' as info, COUNT(*) as count FROM confessions;
SELECT 'After cleanup - comments count:' as info, COUNT(*) as count FROM comments;
SELECT 'After cleanup - votes count:' as info, COUNT(*) as count FROM votes;
SELECT 'After cleanup - reactions count:' as info, COUNT(*) as count FROM reactions;
SELECT 'After cleanup - reports count:' as info, COUNT(*) as count FROM reports;
