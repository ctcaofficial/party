-- CTCA Party Database Schema
-- Run this in your Supabase SQL Editor

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
    id BIGSERIAL PRIMARY KEY,
    board TEXT NOT NULL DEFAULT 'b',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    poster_name TEXT DEFAULT 'Anonymous',
    poster_id TEXT NOT NULL,
    image_url TEXT,
    image_name TEXT,
    image_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    reply_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    is_sticky BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    bumped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create replies table
CREATE TABLE IF NOT EXISTS replies (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT REFERENCES threads(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    poster_name TEXT DEFAULT 'Anonymous',
    poster_id TEXT NOT NULL,
    image_url TEXT,
    image_name TEXT,
    image_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create boards table for dynamic board management
CREATE TABLE IF NOT EXISTS boards (
    id BIGSERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Other',
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_board ON threads(board);
CREATE INDEX IF NOT EXISTS idx_threads_bumped_at ON threads(bumped_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_sticky ON threads(is_sticky DESC);
CREATE INDEX IF NOT EXISTS idx_threads_board_bumped ON threads(board, bumped_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_deleted ON threads(is_deleted);
CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies(created_at);
CREATE INDEX IF NOT EXISTS idx_replies_deleted ON replies(is_deleted);
CREATE INDEX IF NOT EXISTS idx_boards_slug ON boards(slug);

-- Enable Row Level Security
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anonymous imageboard)
CREATE POLICY "Anyone can view threads" ON threads FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "Anyone can create threads" ON threads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update threads" ON threads FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete threads" ON threads FOR DELETE USING (true);

CREATE POLICY "Anyone can view replies" ON replies FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "Anyone can create replies" ON replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update replies" ON replies FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete replies" ON replies FOR DELETE USING (true);

CREATE POLICY "Anyone can view boards" ON boards FOR SELECT USING (true);
CREATE POLICY "Anyone can create boards" ON boards FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update boards" ON boards FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete boards" ON boards FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE threads;
ALTER PUBLICATION supabase_realtime ADD TABLE replies;
ALTER PUBLICATION supabase_realtime ADD TABLE boards;

-- Function to bump thread
CREATE OR REPLACE FUNCTION bump_thread(thread_id BIGINT, new_images INTEGER DEFAULT 0)
RETURNS void AS $$
BEGIN
    UPDATE threads
    SET 
        reply_count = reply_count + 1,
        image_count = image_count + new_images,
        bumped_at = NOW()
    WHERE id = thread_id;
END;
$$ LANGUAGE plpgsql;
