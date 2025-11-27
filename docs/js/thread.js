// Single Thread View Page (thread.html)

let currentThread = null;
let currentBoard = null;
let replySubscription = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentBoard = getCurrentBoard();
    
    setupBoardHeader(currentBoard);
    setupNavigation(currentBoard);
    setupLightbox();
    setupFileInput('replyImage', 'replyFileInfo');
    await loadThread();
    setupReplyForm();
    setupRefresh();
});

/**
 * Setup board header with board info
 */
function setupBoardHeader(board) {
    const info = getBoardInfo(board);
    const boardTitle = document.getElementById('boardTitle');
    const boardSubtitle = document.getElementById('boardSubtitle');
    
    boardTitle.textContent = SITE_NAME;
    boardSubtitle.textContent = `/${board}/ - ${info.name}`;
}

/**
 * Setup navigation links
 */
function setupNavigation(board) {
    const indexLink = document.getElementById('indexLink');
    const catalogLink = document.getElementById('catalogLink');
    const returnLink = document.getElementById('returnLink');
    const catalogLinkBottom = document.getElementById('catalogLinkBottom');
    const boardLink = document.getElementById('boardLink');
    
    indexLink.href = `board.html?board=${board}`;
    catalogLink.href = `catalog.html?board=${board}`;
    returnLink.href = `board.html?board=${board}`;
    catalogLinkBottom.href = `catalog.html?board=${board}`;
    boardLink.href = `board.html?board=${board}`;
    boardLink.textContent = `/${board}/`;
    
    buildTopNav();
}

/**
 * Build top navigation bar with board links
 */
function buildTopNav() {
    const navBoards = document.getElementById('navBoards');
    if (!navBoards) return;
    
    const boardTags = Object.keys(BOARDS);
    const links = boardTags.map(tag => 
        `<a href="board.html?board=${tag}" class="nav-board-link" data-testid="nav-board-${tag}">/${tag}/</a>`
    ).join(' ');
    
    navBoards.innerHTML = links;
}

/**
 * Load and display the thread
 */
async function loadThread() {
    const threadId = getThreadIdFromUrl();
    const threadContainer = document.getElementById('threadContainer');
    const replyFormContainer = document.getElementById('replyFormContainer');
    const threadSubject = document.getElementById('threadSubject');
    
    if (!threadId) {
        showError(threadContainer, 'Thread not found. Please go back to the board.');
        return;
    }
    
    try {
        currentThread = await fetchThread(parseInt(threadId));
        
        // Update page title and breadcrumb
        document.title = `${currentThread.subject} - /${currentBoard}/ - CTCA Party`;
        threadSubject.textContent = `Thread #${currentThread.id}`;
        
        // Render thread
        renderThread(currentThread);
        
        // Show reply form
        replyFormContainer.style.display = 'block';
        
        // Setup realtime updates
        setupRealtimeReplies(currentThread.id);
        
    } catch (error) {
        showError(threadContainer, 'Error loading thread. It may have been deleted.');
        console.error(error);
    }
}

/**
 * Render the complete thread
 */
function renderThread(thread) {
    const threadContainer = document.getElementById('threadContainer');
    
    let html = renderOP(thread);
    
    // Render all replies
    for (const reply of thread.replies) {
        html += renderReply(reply);
    }
    
    threadContainer.innerHTML = html;
    setupImageClicks(threadContainer);
    setupQuoteLinks();
}

/**
 * Render the original post (OP)
 */
function renderOP(thread) {
    let html = `
        <div class="post op-post" id="p${thread.id}" data-testid="post-op-${thread.id}">
    `;
    
    if (thread.image_url) {
        html += `
            <div class="post-image-container">
                <a href="${thread.image_url}" target="_blank">
                    <img src="${thread.image_url}" alt="OP image" class="post-thumb" data-testid="img-op-${thread.id}">
                </a>
                <div class="file-info-line">
                    ${escapeHtml(thread.image_name || 'image')} (${formatFileSize(thread.image_size)}${thread.image_width ? `, ${thread.image_width}x${thread.image_height}` : ''})
                </div>
            </div>
        `;
    }
    
    html += `
            <div class="post-body">
                <div class="post-header">
                    ${thread.is_sticky ? '<span class="sticky-badge">Sticky</span>' : ''}
                    <span class="post-subject">${escapeHtml(thread.subject)}</span>
                    <span class="post-name">${escapeHtml(thread.poster_name)}</span>
                    <span class="poster-id">ID: ${thread.poster_id}</span>
                    <span class="post-date">${formatDate(thread.created_at)}</span>
                    <a href="#p${thread.id}" class="post-number" data-post="${thread.id}" data-testid="link-post-${thread.id}">No.${thread.id}</a>
                </div>
                <div class="post-message">${parseMessage(thread.message)}</div>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Render a single reply
 */
function renderReply(reply) {
    let html = `
        <div class="post reply-post" id="p${reply.id}" data-testid="post-reply-${reply.id}">
    `;
    
    if (reply.image_url) {
        html += `
            <div class="post-image-container">
                <a href="${reply.image_url}" target="_blank">
                    <img src="${reply.image_url}" alt="Reply image" class="post-thumb" data-testid="img-reply-${reply.id}">
                </a>
                <div class="file-info-line">
                    ${escapeHtml(reply.image_name || 'image')} (${formatFileSize(reply.image_size)}${reply.image_width ? `, ${reply.image_width}x${reply.image_height}` : ''})
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
                    <a href="#p${reply.id}" class="post-number" data-post="${reply.id}" data-testid="link-post-${reply.id}">No.${reply.id}</a>
                </div>
                <div class="post-message">${parseMessage(reply.message)}</div>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Setup reply form submission
 */
function setupReplyForm() {
    const replyForm = document.getElementById('replyForm');
    const replySubmitBtn = document.getElementById('replySubmitBtn');
    
    replyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentThread) return;
        
        const message = document.getElementById('replyMessage').value.trim();
        const posterName = document.getElementById('replyName').value.trim() || 'Anonymous';
        const imageFile = document.getElementById('replyImage').files[0];
        
        if (!message) {
            alert('Message is required.');
            return;
        }
        
        replySubmitBtn.disabled = true;
        replySubmitBtn.textContent = 'Posting...';
        
        try {
            await createReply(currentThread.id, {
                message,
                posterName
            }, imageFile);
            
            // Clear form
            document.getElementById('replyMessage').value = '';
            document.getElementById('replyName').value = '';
            document.getElementById('replyImage').value = '';
            document.getElementById('replyFileInfo').textContent = '';
            
            // Reload thread to show new reply
            await loadThread();
            
            // Scroll to bottom
            window.scrollTo(0, document.body.scrollHeight);
            
        } catch (error) {
            alert('Error posting reply. Please try again.');
            console.error(error);
        } finally {
            replySubmitBtn.disabled = false;
            replySubmitBtn.textContent = 'Post Reply';
        }
    });
}

/**
 * Setup click handlers for post numbers to quote
 */
function setupQuoteLinks() {
    const postNumbers = document.querySelectorAll('.post-number[data-post]');
    
    postNumbers.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = link.getAttribute('data-post');
            insertQuote(postId);
        });
    });
}

/**
 * Insert quote link into reply textarea
 */
function insertQuote(postId) {
    const textarea = document.getElementById('replyMessage');
    const quoteText = `>>${postId}\n`;
    
    // Insert at cursor position or append
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + quoteText + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + quoteText.length;
    
    // Scroll to reply form
    document.getElementById('replyFormContainer').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Setup realtime updates for replies
 */
function setupRealtimeReplies(threadId) {
    // Unsubscribe from previous subscription if any
    if (replySubscription) {
        unsubscribe(replySubscription);
    }
    
    replySubscription = subscribeToReplies(threadId, (payload) => {
        console.log('New reply:', payload);
        if (payload.eventType === 'INSERT') {
            // Add new reply to the page
            const threadContainer = document.getElementById('threadContainer');
            const newReplyHtml = renderReply(payload.new);
            threadContainer.insertAdjacentHTML('beforeend', newReplyHtml);
            setupImageClicks(threadContainer);
            setupQuoteLinks();
        }
    });
}

/**
 * Setup refresh button
 */
function setupRefresh() {
    const refreshBtn = document.getElementById('refreshBtn');
    
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.textContent = '[Refreshing...]';
        await loadThread();
        refreshBtn.textContent = '[Refresh]';
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (replySubscription) {
        unsubscribe(replySubscription);
    }
});
