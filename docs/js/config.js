// CTCA Party Configuration
// =====================================================
// IMPORTANT: Before deploying to GitHub Pages, replace
// these values with your Supabase project credentials.
// 
// Get them from: Supabase Dashboard → Project Settings → API
// =====================================================

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Site settings
const SITE_NAME = 'CTCA Party';
const THREADS_PER_PAGE = 15;
const REPLIES_SHOWN_IN_PREVIEW = 3;

// Board definitions
const BOARDS = {
    // Japanese Culture
    'a': { name: 'Anime & Manga', description: 'Discussion of anime and manga', category: 'Japanese Culture' },
    'c': { name: 'Anime/Cute', description: 'For images and discussions related to "cute" anime and manga', category: 'Japanese Culture' },
    'jp': { name: 'Otaku Culture', description: 'Discussion of Japanese otaku culture', category: 'Japanese Culture' },
    'm': { name: 'Mecha', description: 'Discussion of mecha anime and related topics', category: 'Japanese Culture' },
    'w': { name: 'Anime/Wallpapers', description: 'Anime and manga wallpapers', category: 'Japanese Culture' },
    
    // Interests
    'g': { name: 'Technology', description: 'Technology-related topics', category: 'Interests' },
    'v': { name: 'Video Games', description: 'Video game discussion', category: 'Interests' },
    'mu': { name: 'Music', description: 'Music discussion', category: 'Interests' },
    'k': { name: 'Weapons', description: 'Discussion of firearms and other weapons', category: 'Interests' },
    'o': { name: 'Auto', description: 'Automotive topics', category: 'Interests' },
    'p': { name: 'Photography', description: 'Photography discussion', category: 'Interests' },
    't': { name: 'Torrents', description: 'Discussion of torrents and file sharing', category: 'Interests' },
    'x': { name: 'Paranormal', description: 'Paranormal and conspiracy topics', category: 'Interests' },
    
    // Other
    'biz': { name: 'Business & Finance', description: 'Business and finance topics', category: 'Other' },
    'q': { name: 'Questionable', description: 'Questionable content', category: 'Other' },
    'b': { name: 'Random', description: 'Random content', category: 'Other' }
};

// Get board info by tag
function getBoardInfo(tag) {
    return BOARDS[tag] || { name: 'Unknown', description: 'Unknown board', category: 'Other' };
}

// Get current board from URL
function getCurrentBoard() {
    const params = new URLSearchParams(window.location.search);
    return params.get('board') || 'b';
}

// Get all boards grouped by category
function getBoardsByCategory() {
    const categories = {};
    for (const [tag, info] of Object.entries(BOARDS)) {
        if (!categories[info.category]) {
            categories[info.category] = [];
        }
        categories[info.category].push({ tag, ...info });
    }
    return categories;
}
