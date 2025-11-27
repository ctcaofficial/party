-- CTCA Party Database Schema
-- Run this in your Supabase SQL Editor

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
    id BIGSERIAL PRIMARY KEY,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_bumped_at ON threads(bumped_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_sticky ON threads(is_sticky DESC);
CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies(created_at);

-- Enable Row Level Security
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anonymous imageboard)
CREATE POLICY "Anyone can view threads" ON threads FOR SELECT USING (true);
CREATE POLICY "Anyone can create threads" ON threads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update threads" ON threads FOR UPDATE USING (true);

CREATE POLICY "Anyone can view replies" ON replies FOR SELECT USING (true);
CREATE POLICY "Anyone can create replies" ON replies FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE threads;
ALTER PUBLICATION supabase_realtime ADD TABLE replies;
