# CTCA Party - 4chan Style Imageboard

## Overview
CTCA Party is a 4chan-style anonymous imageboard built with pure HTML, CSS, and JavaScript for deployment on GitHub Pages. It uses Supabase for backend storage when configured.

## Project Structure
```
docs/                    # Static files for GitHub Pages deployment
├── index.html          # Board index page (thread listings)
├── thread.html         # Individual thread view
├── catalog.html        # Catalog grid view
├── SETUP.md            # Setup instructions for Supabase
├── schema.sql          # Database schema for Supabase
├── css/
│   └── style.css       # 4chan-style CSS
└── js/
    ├── config.js       # Supabase credentials (user must edit)
    ├── supabase.js     # Supabase client and API functions
    ├── utils.js        # Utility functions
    ├── threads.js      # Board index page logic
    ├── thread.js       # Thread view page logic
    └── catalog.js      # Catalog page logic
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
- Demo mode with sample threads when Supabase not configured

## Running Locally
The server serves static files from the `/docs` folder on port 5000.

## Deployment to GitHub Pages
1. Configure Supabase credentials in `docs/js/config.js`
2. Run the SQL in `docs/schema.sql` in your Supabase project
3. Create storage bucket `ctca-images` in Supabase
4. Push to GitHub and enable Pages from `/docs` folder

## Demo Mode
When Supabase is not configured (default), the app runs in demo mode showing sample threads. This allows testing the UI without a backend.

## Tech Stack
- Pure HTML5, CSS3, JavaScript (ES6+)
- Supabase for database and storage
- No build tools or frameworks required
