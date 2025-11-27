// Catalog View Page (catalog.html)

document.addEventListener('DOMContentLoaded', async () => {
    setupLightbox();
    await loadCatalog();
    setupRealtimeUpdates();
});

/**
 * Load and display catalog
 */
async function loadCatalog() {
    const catalogGrid = document.getElementById('catalogGrid');
    
    try {
        // Fetch all threads (no pagination in catalog view)
        const { threads } = await fetchThreads(1, 100);
        
        if (threads.length === 0) {
            showEmpty(catalogGrid, 'No threads yet', 'Be the first to start a thread!');
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
            window.location.href = `thread.html?id=${threadId}`;
        });
    });
}

/**
 * Setup real-time updates
 */
function setupRealtimeUpdates() {
    subscribeToThreads((payload) => {
        console.log('Thread update:', payload);
        loadCatalog();
    });
}
