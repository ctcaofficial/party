// Board Page (board.html) - Thread Listing for a specific board

function isAdminAuthenticated() {
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) return false;
    try {
        const session = JSON.parse(sessionData);
        return session.authenticated && session.expiry > Date.now();
    } catch (e) {
        return false;
    }
}

function checkBoardAccess(board) {
    const boardInfo = BOARDS[board];
    if (boardInfo && boardInfo.hidden && !isAdminAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    const board = getCurrentBoard();
    
    if (!checkBoardAccess(board)) return;
    
    // Setup page
    setupBoardHeader(board);
    setupNavigation(board);
    setupLightbox();
    setupFileInput('imageFile', 'fileInfo');
    setupPostForm(board);
    await loadThreads(board);
    setupRealtimeUpdates(board);
});

/**
 * Setup board header with board info
 */
function setupBoardHeader(board) {
    const info = getBoardInfo(board);
    const boardTitle = document.getElementById('boardTitle');
    const boardSubtitle = document.getElementById('boardSubtitle');
    
    document.title = `/${board}/ - ${info.name} - CTCA Party`;
    boardTitle.textContent = SITE_NAME;
    boardSubtitle.textContent = `/${board}/ - ${info.name}`;
}

/**
 * Setup navigation links
 */
function setupNavigation(board) {
    // Update nav links
    const indexLink = document.getElementById('indexLink');
    const catalogLink = document.getElementById('catalogLink');
    
    indexLink.href = `board.html?board=${board}`;
    catalogLink.href = `catalog.html?board=${board}`;
    
    // Build top nav with board links
    buildTopNav();
}

/**
 * Build top navigation bar with board links
 */
function buildTopNav() {
    const navBoards = document.getElementById('navBoards');
    if (!navBoards) return;
    
    const boardTags = Object.keys(BOARDS).filter(tag => !BOARDS[tag].hidden);
    const links = boardTags.map(tag => 
        `<a href="board.html?board=${tag}" class="nav-board-link" data-testid="nav-board-${tag}">/${tag}/</a>`
    ).join(' ');
    
    navBoards.innerHTML = links;
}

/**
 * Setup post form toggle and submission
 */
function setupPostForm(board) {
    const toggleBtn = document.getElementById('toggleFormBtn');
    const postForm = document.getElementById('postForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Toggle form visibility
    toggleBtn.addEventListener('click', () => {
        const isHidden = postForm.style.display === 'none';
        postForm.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? 'Close Form' : 'Start a New Thread';
    });
    
    // Handle form submission
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();
        const posterName = document.getElementById('posterName').value.trim() || 'Anonymous';
        const imageFile = document.getElementById('imageFile').files[0];
        
        if (!subject || !message) {
            alert('Subject and message are required.');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
        
        try {
            const thread = await createThread({
                subject,
                message,
                posterName,
                board
            }, imageFile);
            
            // Redirect to new thread
            window.location.href = `thread.html?board=${board}&id=${thread.id}`;
        } catch (error) {
            alert('Error creating thread. Please try again.');
            console.error(error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Thread';
        }
    });
}

/**
 * Load and display threads for this board
 */
async function loadThreads(board) {
    const threadList = document.getElementById('threadList');
    const pagination = document.getElementById('pagination');
    const currentPage = getPageFromUrl();
    
    try {
        const { threads, total } = await fetchThreads(currentPage, THREADS_PER_PAGE, board);
        
        if (threads.length === 0) {
            showEmpty(threadList, 'No threads yet', 'Be the first to start a thread on this board!');
            return;
        }
        
        // Render threads with latest replies
        let html = '';
        
        for (const thread of threads) {
            const replies = await fetchLatestReplies(thread.id);
            html += renderThreadPreview(thread, replies, board);
        }
        
        threadList.innerHTML = html;
        setupImageClicks(threadList);
        
        // Render pagination
        pagination.innerHTML = generateBoardPagination(currentPage, total, THREADS_PER_PAGE, board);
        
    } catch (error) {
        showError(threadList, 'Error loading threads. Please refresh the page.');
        console.error(error);
    }
}

/**
 * Render a thread preview with latest replies
 */
function renderThreadPreview(thread, replies, board) {
    const hasImage = thread.image_url;
    const omittedReplies = Math.max(0, thread.reply_count - replies.length);
    const omittedImages = Math.max(0, thread.image_count - replies.filter(r => r.image_url).length - (hasImage ? 1 : 0));
    
    let html = `
        <div class="thread-preview" data-testid="thread-preview-${thread.id}">
            <div class="thread-op">
    `;
    
    if (hasImage) {
        html += `
                <div class="thread-image-container">
                    <a href="${thread.image_url}" target="_blank">
                        <img src="${thread.image_url}" alt="Thread image" class="thread-thumb" data-testid="img-thread-${thread.id}">
                    </a>
                    <div class="file-info-line">
                        ${escapeHtml(thread.image_name || 'image')} (${formatFileSize(thread.image_size)}${thread.image_width ? `, ${thread.image_width}x${thread.image_height}` : ''})
                    </div>
                </div>
        `;
    }
    
    html += `
                <div class="thread-content">
                    <div class="thread-meta">
                        ${thread.is_sticky ? '<span class="sticky-badge">Sticky</span>' : ''}
                        <span class="post-subject">${escapeHtml(thread.subject)}</span>
                        <span class="post-name">${escapeHtml(thread.poster_name)}</span>
                        <span class="poster-id">ID: ${thread.poster_id}</span>
                        <span class="post-date">${formatDate(thread.created_at)}</span>
                        <a href="thread.html?board=${board}&id=${thread.id}" class="post-number" data-testid="link-thread-${thread.id}">No.${thread.id}</a>
                    </div>
                    <div class="thread-message">${parseMessage(thread.message)}</div>
                    <div class="thread-stats">
                        ${thread.reply_count} replies and ${thread.image_count} images${omittedReplies > 0 ? `, ${omittedReplies} replies omitted` : ''}.
                        <a href="thread.html?board=${board}&id=${thread.id}" data-testid="link-reply-${thread.id}">[Reply]</a>
                    </div>
                </div>
            </div>
    `;
    
    // Render preview replies
    if (replies.length > 0) {
        for (const reply of replies) {
            html += renderReplyPreview(reply);
        }
    }
    
    html += '</div>';
    
    return html;
}

/**
 * Render a reply preview
 */
function renderReplyPreview(reply) {
    let html = `
        <div class="post reply-post" id="p${reply.id}" data-testid="reply-preview-${reply.id}">
    `;
    
    if (reply.image_url) {
        html += `
            <div class="post-image-container">
                <a href="${reply.image_url}" target="_blank">
                    <img src="${reply.image_url}" alt="Reply image" class="post-thumb" data-testid="img-reply-${reply.id}">
                </a>
                <div class="file-info-line">
                    ${escapeHtml(reply.image_name || 'image')} (${formatFileSize(reply.image_size)})
                </div>
            </div>
        `;
    }
    
    html += `
            <div class="post-body">
                <div class="post-header">
                    <span class="post-name">${escapeHtml(reply.poster_name)}</span>
                    <span class="poster-id">ID: ${reply.poster_id}</span>
                    <span class="post-date">${formatDate(reply.created_at)}</span>
                    <span class="post-number">No.${reply.id}</span>
                </div>
                <div class="post-message">${parseMessage(reply.message)}</div>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Generate pagination with board parameter
 */
function generateBoardPagination(currentPage, totalItems, itemsPerPage, board) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return '';
    
    let html = '';
    
    // Previous
    if (currentPage > 1) {
        html += `<a href="board.html?board=${board}&page=${currentPage - 1}" data-testid="link-prev-page">[Previous]</a>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span class="current">[${i}]</span>`;
        } else {
            html += `<a href="board.html?board=${board}&page=${i}" data-testid="link-page-${i}">[${i}]</a>`;
        }
    }
    
    // Next
    if (currentPage < totalPages) {
        html += `<a href="board.html?board=${board}&page=${currentPage + 1}" data-testid="link-next-page">[Next]</a>`;
    }
    
    return html;
}

/**
 * Setup real-time updates for this board
 */
function setupRealtimeUpdates(board) {
    subscribeToThreads((payload) => {
        console.log('Thread update:', payload);
        // Only reload if the update is for this board
        if (payload.new && payload.new.board === board) {
            loadThreads(board);
        } else if (!payload.new || !payload.new.board) {
            // Fallback - reload anyway
            loadThreads(board);
        }
    });
}
