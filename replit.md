# CTCA Party - 4chan Style Imageboard

## Overview
CTCA Party is a 4chan-style anonymous imageboard built with pure HTML, CSS, and JavaScript for deployment on GitHub Pages. It uses Supabase for backend storage when configured.

## Project Structure
```
docs/                    # Static files for GitHub Pages deployment
├── index.html          # Board index page (thread listings)
├── board.html          # Board view page
├── thread.html         # Individual thread view
├── catalog.html        # Catalog grid view
├── admin.html          # Admin login page (hidden)
├── dashboard.html      # Admin dashboard
├── SETUP.md            # Setup instructions for Supabase
├── schema.sql          # Database schema for Supabase
├── css/
│   └── style.css       # 4chan-style CSS
└── js/
    ├── config.js       # Board definitions and Supabase credentials
    ├── supabase.js     # Supabase client and API functions
    ├── utils.js        # Utility functions
    ├── board.js        # Board page logic
    ├── thread.js       # Thread view page logic
    ├── catalog.js      # Catalog page logic
    ├── admin.js        # Admin login logic
    └── admin-dashboard.js  # Admin dashboard logic
```

## Features
- Classic 4chan-style UI with tan/cream backgrounds
- Anonymous posting with random poster IDs
- Thread creation with subject, message, and optional images
- Reply system with quote links (>>postNumber)
- Greentext support (lines starting with >)
- Catalog view with grid layout
- Image lightbox for full-size viewing
- Real-time updates via Supabase (when configured)
- CTCA board as a public community board

## Admin Features
- Admin login page at `/admin.html` (username: CTCA, password: drayfrick12)
- Admin dashboard at `/dashboard.html` with:
  - Board Management: View all boards, add new dynamic boards, edit/delete boards
  - Thread Management: View all threads, sticky/unsticky, lock/unlock, delete/restore
  - Moderation Panel: View stats, recent activity

## Moderation Capabilities
- Sticky threads: Pin important threads to top of board
- Lock threads: Prevent new replies
- Delete threads: Soft delete (can be restored)
- Delete replies: Soft delete individual replies
- Dynamic board creation through Supabase

## Running Locally
The server serves static files from the `/docs` folder on port 5000.

## Deployment to GitHub Pages
1. Configure Supabase credentials in `docs/js/config.js`
2. Run the SQL in `docs/schema.sql` in your Supabase project
3. Create storage bucket `ctca-images` in Supabase
4. Push to GitHub and enable Pages from `/docs` folder

## Tech Stack
- Pure HTML5, CSS3, JavaScript (ES6+)
- Supabase for database and storage
- No build tools or frameworks required

## Database Schema
The schema includes:
- `threads` table: board, subject, message, poster info, image data, is_sticky, is_locked, is_deleted
- `replies` table: thread_id, message, poster info, image data, is_deleted
- `boards` table: slug, name, description, category, is_hidden (for dynamic board management)
