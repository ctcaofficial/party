# CTCA Party Setup Guide

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for your database to be provisioned

## Step 2: Create Database Tables

Go to the SQL Editor in your Supabase dashboard and run this SQL:

```sql
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
```

## Step 3: Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `ctca-images`
3. Make it **public** (uncheck "Restrict file uploads to authenticated users")
4. Add a policy to allow public uploads:

```sql
-- Allow public uploads to the bucket
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ctca-images');

CREATE POLICY "Allow public downloads" ON storage.objects
    FOR SELECT USING (bucket_id = 'ctca-images');
```

## Step 4: Configure the App

1. Go to Project Settings → API in Supabase
2. Copy your **Project URL** and **anon public key**
3. Edit `docs/js/config.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## Step 5: Deploy to GitHub Pages

1. Push the `docs` folder to your GitHub repository
2. Go to Settings → Pages
3. Under "Source", select "Deploy from a branch"
4. Choose your branch and `/docs` folder
5. Save and wait for deployment

Your CTCA Party imageboard will be live at `https://yourusername.github.io/your-repo-name/`

## Local Testing

You can test locally by serving the docs folder:

```bash
cd docs
python -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000 in your browser.
