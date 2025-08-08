-- Add video_context column to confessions table
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS video_context text;

-- Add a comment to document the column
COMMENT ON COLUMN confessions.video_context IS 'Optional context text for video uploads to help viewers understand the video content';
