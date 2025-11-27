// Utility Functions

/**
 * Generate a random poster ID (8 character hex)
 */
function generatePosterId() {
    const chars = '0123456789ABCDEF';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

/**
 * Get or create poster ID for a thread (stored in sessionStorage)
 */
function getThreadPosterId(threadId) {
    const key = `poster_id_${threadId}`;
    let posterId = sessionStorage.getItem(key);
    
    if (!posterId) {
        posterId = generatePosterId();
        sessionStorage.setItem(key, posterId);
    }
    
    return posterId;
}

/**
 * Format date to chan-style format
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const dayName = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${month}/${day}/${year}(${dayName})${hours}:${minutes}:${seconds}`;
}

/**
 * Format file size to human readable
 */
function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Parse message for greentext and quote links
 */
function parseMessage(message) {
    if (!message) return '';
    
    // Escape HTML
    let parsed = escapeHtml(message);
    
    // Parse greentext (lines starting with >)
    parsed = parsed.split('\n').map(line => {
        if (line.startsWith('&gt;') && !line.startsWith('&gt;&gt;')) {
            return `<span class="greentext">${line}</span>`;
        }
        return line;
    }).join('\n');
    
    // Parse quote links (>>number)
    parsed = parsed.replace(/&gt;&gt;(\d+)/g, '<a href="#p$1" class="quotelink" data-post="$1">&gt;&gt;$1</a>');
    
    return parsed;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncate text to a max length
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Get thread ID from URL parameters
 */
function getThreadIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Get page number from URL
 */
function getPageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('page')) || 1;
}

/**
 * Setup lightbox functionality
 */
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.getElementById('lightboxClose');
    
    if (!lightbox) return;
    
    // Close on click outside image or close button
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === lightboxClose) {
            closeLightbox();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
}

/**
 * Open lightbox with image
 */
function openLightbox(imageUrl) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    if (lightbox && lightboxImage) {
        lightboxImage.src = imageUrl;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close lightbox
 */
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Add click handlers to images
 */
function setupImageClicks(container) {
    const images = container.querySelectorAll('.thread-thumb, .post-thumb, .catalog-thumb');
    
    images.forEach(img => {
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(img.src);
        });
    });
}

/**
 * Show loading state
 */
function showLoading(container) {
    container.innerHTML = '<div class="loading">Loading...</div>';
}

/**
 * Show error state
 */
function showError(container, message) {
    container.innerHTML = `<div class="error-state">${escapeHtml(message)}</div>`;
}

/**
 * Show empty state
 */
function showEmpty(container, title, message) {
    container.innerHTML = `
        <div class="empty-state">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Generate pagination HTML
 */
function generatePagination(currentPage, totalItems, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return '';
    
    let html = '';
    
    // Previous
    if (currentPage > 1) {
        html += `<a href="?page=${currentPage - 1}" data-testid="link-prev-page">[Previous]</a>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span class="current">[${i}]</span>`;
        } else {
            html += `<a href="?page=${i}" data-testid="link-page-${i}">[${i}]</a>`;
        }
    }
    
    // Next
    if (currentPage < totalPages) {
        html += `<a href="?page=${currentPage + 1}" data-testid="link-next-page">[Next]</a>`;
    }
    
    return html;
}

/**
 * Validate image file
 */
function validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed.' };
    }
    
    if (file.size > maxSize) {
        return { valid: false, error: 'File size must be less than 5MB.' };
    }
    
    return { valid: true };
}

/**
 * Display file info when selected
 */
function setupFileInput(inputId, infoId) {
    const input = document.getElementById(inputId);
    const info = document.getElementById(infoId);
    
    if (!input || !info) return;
    
    input.addEventListener('change', () => {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const validation = validateImageFile(file);
            
            if (validation.valid) {
                info.textContent = `${file.name} (${formatFileSize(file.size)})`;
                info.style.color = '';
            } else {
                info.textContent = validation.error;
                info.style.color = '#c00';
                input.value = '';
            }
        } else {
            info.textContent = '';
        }
    });
}
