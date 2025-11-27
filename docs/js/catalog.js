// Catalog View Page (catalog.html)

let currentBoard = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentBoard = getCurrentBoard();
    
    setupBoardHeader(currentBoard);
    setupNavigation(currentBoard);
    setupLightbox();
    await loadCatalog();
    setupRealtimeUpdates();
});

/**
 * Setup board header with board info
 */
function setupBoardHeader(board) {
    const info = getBoardInfo(board);
    const boardTitle = document.getElementById('boardTitle');
    const boardSubtitle = document.getElementById('boardSubtitle');
    
    document.title = `Catalog - /${board}/ - ${info.name} - CTCA Party`;
    boardTitle.textContent = SITE_NAME;
    boardSubtitle.textContent = `/${board}/ - ${info.name}`;
}

/**
 * Setup navigation links
 */
function setupNavigation(board) {
    const indexLink = document.getElementById('indexLink');
    const catalogLink = document.getElementById('catalogLink');
    
    indexLink.href = `board.html?board=${board}`;
    catalogLink.href = `catalog.html?board=${board}`;
    
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
 * Load and display catalog
 */
async function loadCatalog() {
    const catalogGrid = document.getElementById('catalogGrid');
    
    try {
        // Fetch all threads for this board (no pagination in catalog view)
        const { threads } = await fetchThreads(1, 100, currentBoard);
        
        if (threads.length === 0) {
            showEmpty(catalogGrid, 'No threads yet', 'Be the first to start a thread on this board!');
            return;
        }
        
        let html = '';
        
        for (const thread of threads) {
            html += renderCatalogItem(thread);
        }
        
        catalogGrid.innerHTML = html;
        
        // Setup click handlers for catalog items
        setupCatalogClicks();
        
    } catch (error) {
        showError(catalogGrid, 'Error loading catalog. Please refresh the page.');
        console.error(error);
    }
}

/**
 * Render a catalog item
 */
function renderCatalogItem(thread) {
    const hasImage = thread.image_url;
    
    let html = `
        <div class="catalog-item" data-thread-id="${thread.id}" data-testid="catalog-item-${thread.id}">
    `;
    
    if (hasImage) {
        html += `<img src="${thread.image_url}" alt="${escapeHtml(thread.subject)}" class="catalog-thumb" data-testid="catalog-img-${thread.id}">`;
    } else {
        html += `<div class="catalog-no-image">No Image</div>`;
    }
    
    html += `
            <div class="catalog-stats">R: ${thread.reply_count} / I: ${thread.image_count}</div>
            <div class="catalog-subject">${escapeHtml(thread.subject)}</div>
            <div class="catalog-teaser">${escapeHtml(truncateText(thread.message, 100))}</div>
        </div>
    `;
    
    return html;
}

/**
 * Setup click handlers for catalog items
 */
function setupCatalogClicks() {
    const catalogItems = document.querySelectorAll('.catalog-item');
    
    catalogItems.forEach(item => {
        item.addEventListener('click', () => {
            const threadId = item.getAttribute('data-thread-id');
            window.location.href = `thread.html?board=${currentBoard}&id=${threadId}`;
        });
    });
}

/**
 * Setup real-time updates
 */
function setupRealtimeUpdates() {
    subscribeToThreads((payload) => {
        console.log('Thread update:', payload);
        // Only reload if the update is for this board
        if (payload.new && payload.new.board === currentBoard) {
            loadCatalog();
        } else if (!payload.new || !payload.new.board) {
            loadCatalog();
        }
    });
}
