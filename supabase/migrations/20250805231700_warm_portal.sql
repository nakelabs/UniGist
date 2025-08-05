/*
  # Initial Schema for UniGist

  1. New Tables
    - `confessions`
      - `id` (uuid, primary key)
      - `content` (text)
      - `audio_url` (text, nullable)
      - `video_url` (text, nullable) 
      - `image_url` (text, nullable)
      - `tags` (text array)
      - `upvotes` (integer, default 0)
      - `downvotes` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `confession_id` (uuid, foreign key)
      - `content` (text)
      - `upvotes` (integer, default 0)
      - `downvotes` (integer, default 0)
      - `is_anonymous` (boolean, default true)
      - `username` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `votes`
      - `id` (uuid, primary key)
      - `user_fingerprint` (text)
      - `target_type` (text) -- 'confession' or 'comment'
      - `target_id` (uuid)
      - `vote_type` (text) -- 'up' or 'down'
      - `created_at` (timestamp)
    
    - `reports`
      - `id` (uuid, primary key)
      - `target_type` (text) -- 'confession' or 'comment'
      - `target_id` (uuid)
      - `reason` (text)
      - `custom_reason` (text, nullable)
      - `status` (text, default 'pending') -- 'pending', 'resolved', 'dismissed'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin access
*/

-- Create confessions table
CREATE TABLE IF NOT EXISTS confessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  audio_url text,
  video_url text,
  image_url text,
  tags text[] DEFAULT '{}',
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id uuid REFERENCES confessions(id) ON DELETE CASCADE,
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  is_anonymous boolean DEFAULT true,
  username text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fingerprint text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('confession', 'comment')),
  target_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_fingerprint, target_type, target_id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('confession', 'comment')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  custom_reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies for confessions (public read, no auth required for create)
CREATE POLICY "Anyone can read confessions"
  ON confessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create confessions"
  ON confessions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for comments (public read, no auth required for create)
CREATE POLICY "Anyone can read comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for votes (public read/write)
CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for reports (public read/write)
CREATE POLICY "Anyone can read reports"
  ON reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create reports"
  ON reports
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can update reports (for admin)
CREATE POLICY "Authenticated users can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_upvotes ON confessions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_comments_confession_id ON comments(confession_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_fingerprint ON votes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_confessions_updated_at
  BEFORE UPDATE ON confessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();