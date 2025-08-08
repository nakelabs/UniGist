-- Add image_context column to confessions table
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS image_context TEXT;

-- Add comment to the column
COMMENT ON COLUMN confessions.image_context IS 'Optional context or description for image uploads';
