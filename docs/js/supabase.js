// Initialize Supabase client
let supabaseClient = null;
let isConfigured = false;

// Check if Supabase is properly configured
function initSupabase() {
    if (supabaseClient) return true;
    
    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL' ||
        !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Supabase not configured. Please update js/config.js with your Supabase credentials.');
        isConfigured = false;
        return false;
    }
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isConfigured = true;
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        isConfigured = false;
        return false;
    }
}

// Initialize on load
initSupabase();

// Database API Functions

/**
 * Fetch all threads with pagination for a specific board
 */
async function fetchThreads(page = 1, limit = THREADS_PER_PAGE, board = 'b') {
    if (!isConfigured) {
        const demoThreads = getDemoThreads(board);
        return { threads: demoThreads, total: demoThreads.length };
    }
    
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabaseClient
        .from('threads')
        .select('*', { count: 'exact' })
        .eq('board', board)
        .order('is_sticky', { ascending: false })
        .order('bumped_at', { ascending: false })
        .range(offset, offset + limit - 1);
    
    if (error) {
        console.error('Error fetching threads:', error);
        throw error;
    }
    
    return { threads: data || [], total: count || 0 };
}

/**
 * Fetch a single thread with all replies
 */
async function fetchThread(threadId) {
    if (!isConfigured) {
        // Search all boards for demo thread
        for (const board of Object.keys(BOARDS)) {
            const demoThread = getDemoThreads(board).find(t => t.id === threadId);
            if (demoThread) {
                return { ...demoThread, replies: getDemoReplies(threadId) };
            }
        }
        throw new Error('Thread not found');
    }
    
    const { data: thread, error: threadError } = await supabaseClient
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single();
    
    if (threadError) {
        console.error('Error fetching thread:', threadError);
        throw threadError;
    }
    
    const { data: replies, error: repliesError } = await supabaseClient
        .from('replies')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
    
    if (repliesError) {
        console.error('Error fetching replies:', repliesError);
        throw repliesError;
    }
    
    return { ...thread, replies: replies || [] };
}

/**
 * Fetch latest replies for a thread (for preview)
 */
async function fetchLatestReplies(threadId, limit = REPLIES_SHOWN_IN_PREVIEW) {
    if (!isConfigured) {
        return getDemoReplies(threadId).slice(-limit);
    }
    
    const { data, error } = await supabaseClient
        .from('replies')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(limit);
    
    if (error) {
        console.error('Error fetching replies:', error);
        return [];
    }
    
    return (data || []).reverse();
}

/**
 * Create a new thread
 */
async function createThread(threadData, imageFile) {
    if (!isConfigured) {
        alert('Please configure Supabase in js/config.js to create threads.');
        throw new Error('Supabase not configured');
    }
    
    let imageData = {};
    
    if (imageFile) {
        imageData = await uploadImage(imageFile);
    }
    
    const posterId = generatePosterId();
    
    const { data, error } = await supabaseClient
        .from('threads')
        .insert([{
            board: threadData.board || 'b',
            subject: threadData.subject,
            message: threadData.message,
            poster_name: threadData.posterName || 'Anonymous',
            poster_id: posterId,
            image_url: imageData.url || null,
            image_name: imageData.name || null,
            image_size: imageData.size || null,
            image_width: imageData.width || null,
            image_height: imageData.height || null,
            reply_count: 0,
            image_count: imageFile ? 1 : 0,
            is_sticky: false,
            bumped_at: new Date().toISOString()
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating thread:', error);
        throw error;
    }
    
    return data;
}

/**
 * Create a reply to a thread
 */
async function createReply(threadId, replyData, imageFile) {
    if (!isConfigured) {
        alert('Please configure Supabase in js/config.js to post replies.');
        throw new Error('Supabase not configured');
    }
    
    let imageData = {};
    
    if (imageFile) {
        imageData = await uploadImage(imageFile);
    }
    
    // Get or generate poster ID for this thread
    const posterId = getThreadPosterId(threadId);
    
    const { data, error } = await supabaseClient
        .from('replies')
        .insert([{
            thread_id: threadId,
            message: replyData.message,
            poster_name: replyData.posterName || 'Anonymous',
            poster_id: posterId,
            image_url: imageData.url || null,
            image_name: imageData.name || null,
            image_size: imageData.size || null,
            image_width: imageData.width || null,
            image_height: imageData.height || null
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating reply:', error);
        throw error;
    }
    
    // Update thread bump time and counts
    await updateThreadStats(threadId, imageFile ? 1 : 0);
    
    return data;
}

/**
 * Update thread statistics after a reply
 */
async function updateThreadStats(threadId, newImages = 0) {
    if (!isConfigured) return;
    
    const { error } = await supabaseClient.rpc('bump_thread', {
        thread_id: threadId,
        new_images: newImages
    });
    
    // Fallback if RPC doesn't exist
    if (error) {
        const { data: thread } = await supabaseClient
            .from('threads')
            .select('reply_count, image_count')
            .eq('id', threadId)
            .single();
        
        if (thread) {
            await supabaseClient
                .from('threads')
                .update({
                    reply_count: (thread.reply_count || 0) + 1,
                    image_count: (thread.image_count || 0) + newImages,
                    bumped_at: new Date().toISOString()
                })
                .eq('id', threadId);
        }
    }
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImage(file) {
    if (!isConfigured) {
        throw new Error('Supabase not configured');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `images/${fileName}`;
    
    const { error: uploadError } = await supabaseClient.storage
        .from('ctca-images')
        .upload(filePath, file);
    
    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
    }
    
    const { data: urlData } = supabaseClient.storage
        .from('ctca-images')
        .getPublicUrl(filePath);
    
    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    
    return {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height
    };
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
            resolve({ width: 0, height: 0 });
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Subscribe to real-time updates for threads
 */
function subscribeToThreads(callback) {
    if (!isConfigured || !supabaseClient) {
        console.log('Realtime disabled - Supabase not configured');
        return null;
    }
    
    return supabaseClient
        .channel('threads-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, callback)
        .subscribe();
}

/**
 * Subscribe to real-time updates for replies in a thread
 */
function subscribeToReplies(threadId, callback) {
    if (!isConfigured || !supabaseClient) {
        console.log('Realtime disabled - Supabase not configured');
        return null;
    }
    
    return supabaseClient
        .channel(`replies-${threadId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'replies',
            filter: `thread_id=eq.${threadId}`
        }, callback)
        .subscribe();
}

/**
 * Unsubscribe from a channel
 */
function unsubscribe(subscription) {
    if (subscription && supabaseClient) {
        supabaseClient.removeChannel(subscription);
    }
}

// Demo data for when Supabase is not configured
function getDemoThreads(board) {
    const allDemoThreads = {
        'b': [
            {
                id: 1,
                board: 'b',
                subject: 'Welcome to /b/ - Random!',
                message: 'This is a demo thread. Configure Supabase to enable full functionality.\n\n>be me\n>creating an imageboard\n>feels good',
                poster_name: 'Anonymous',
                poster_id: 'DEMO1234',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                reply_count: 2,
                image_count: 0,
                is_sticky: true,
                bumped_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: 2,
                board: 'b',
                subject: 'Random Thread',
                message: '>testing greentext\n\nThis is a test thread to show off the UI styling.',
                poster_name: 'Anon',
                poster_id: 'TEST9ABC',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                reply_count: 0,
                image_count: 0,
                is_sticky: false,
                bumped_at: new Date(Date.now() - 3600000).toISOString(),
                created_at: new Date(Date.now() - 10800000).toISOString()
            }
        ],
        'g': [
            {
                id: 100,
                board: 'g',
                subject: 'What distro do you use?',
                message: 'I use Arch btw.\n\n>inb4 gentoo users',
                poster_name: 'Anonymous',
                poster_id: 'TECH1234',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                reply_count: 1,
                image_count: 0,
                is_sticky: false,
                bumped_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 7200000).toISOString()
            }
        ],
        'a': [
            {
                id: 200,
                board: 'a',
                subject: 'Anime of the Season',
                message: 'What are you watching this season anons?\n\n>tfw no good isekai',
                poster_name: 'Anonymous',
                poster_id: 'WEEB5678',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                reply_count: 0,
                image_count: 0,
                is_sticky: false,
                bumped_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 1800000).toISOString()
            }
        ],
        'v': [
            {
                id: 300,
                board: 'v',
                subject: 'Best RPGs of all time',
                message: 'List your top 5 RPGs.\n\n1. Chrono Trigger\n2. Final Fantasy VI\n3. Baldurs Gate 2\n4. Planescape Torment\n5. Dark Souls',
                poster_name: 'Anonymous',
                poster_id: 'GAMER999',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                reply_count: 0,
                image_count: 0,
                is_sticky: false,
                bumped_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 5400000).toISOString()
            }
        ]
    };
    
    return allDemoThreads[board] || [];
}

function getDemoReplies(threadId) {
    if (threadId === 1) {
        return [
            {
                id: 101,
                thread_id: 1,
                message: '>>1\nNice board anon!',
                poster_name: 'Anonymous',
                poster_id: 'REPLY001',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                created_at: new Date(Date.now() - 1800000).toISOString()
            },
            {
                id: 102,
                thread_id: 1,
                message: '>mfw this actually works\n\nBased',
                poster_name: 'Anonymous',
                poster_id: 'REPLY002',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                created_at: new Date(Date.now() - 900000).toISOString()
            }
        ];
    }
    if (threadId === 100) {
        return [
            {
                id: 1001,
                thread_id: 100,
                message: '>Arch\nI use Gentoo. Compile everything.',
                poster_name: 'Anonymous',
                poster_id: 'GENTOO01',
                image_url: null,
                image_name: null,
                image_size: null,
                image_width: null,
                image_height: null,
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
    }
    return [];
}
