-- Storage bucket setup for confessions
-- Run this in Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'confessions',
  'confessions', 
  true,
  ARRAY['audio/*', 'video/*', 'image/*', 'text/*'],
  52428800 -- 50MB in bytes
) ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the confessions bucket
CREATE POLICY "Give users authenticated access to folder" ON storage.objects
  FOR ALL 
  TO public 
  USING (bucket_id = 'confessions');

-- Alternative: More permissive policy for public bucket
CREATE POLICY "Allow public uploads to confessions bucket" ON storage.objects
  FOR INSERT 
  TO public
  WITH CHECK (bucket_id = 'confessions');

CREATE POLICY "Allow public downloads from confessions bucket" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'confessions');

CREATE POLICY "Allow public deletes from confessions bucket" ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'confessions');
