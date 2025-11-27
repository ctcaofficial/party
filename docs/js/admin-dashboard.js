// Admin Dashboard JavaScript

let currentTab = 'boards';
let editingBoardId = null;

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

function clearAdminSession() {
    sessionStorage.removeItem('adminSession');
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAdminAuthenticated()) {
        window.location.href = 'admin.html';
        return;
    }

    setupTabNavigation();
    setupModals();
    setupLogout();
    await loadBoardsPanel();
});

function setupTabNavigation() {
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const tab = btn.dataset.tab;
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById(`${tab}Panel`).classList.remove('hidden');
            
            currentTab = tab;
            
            if (tab === 'boards') await loadBoardsPanel();
            if (tab === 'threads') await loadThreadsPanel();
            if (tab === 'moderation') await loadModerationPanel();
        });
    });
}

function setupModals() {
    const boardModal = document.getElementById('boardModal');
    const confirmModal = document.getElementById('confirmModal');
    
    document.getElementById('addBoardBtn').addEventListener('click', () => {
        editingBoardId = null;
        document.getElementById('boardModalTitle').textContent = 'Add Board';
        document.getElementById('boardForm').reset();
        document.getElementById('boardSlug').disabled = false;
        boardModal.classList.remove('hidden');
    });
    
    document.getElementById('closeBoardModal').addEventListener('click', () => {
        boardModal.classList.add('hidden');
    });
    
    document.getElementById('cancelBoardBtn').addEventListener('click', () => {
        boardModal.classList.add('hidden');
    });
    
    document.getElementById('confirmCancel').addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });
    
    document.getElementById('boardForm').addEventListener('submit', handleBoardSubmit);
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearAdminSession();
        window.location.href = 'admin.html';
    });
}

async function loadBoardsPanel() {
    const tbody = document.getElementById('boardsTableBody');
    
    const staticBoards = Object.entries(BOARDS).map(([slug, info]) => ({
        slug,
        name: info.name,
        description: info.description,
        category: info.category,
        isStatic: true
    }));
    
    let dynamicBoards = [];
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data } = await supabaseClient.from('boards').select('*');
            if (data) {
                dynamicBoards = data.map(b => ({
                    id: b.id,
                    slug: b.slug,
                    name: b.name,
                    description: b.description,
                    category: b.category,
                    isStatic: false
                }));
            }
        } catch (e) {
            console.log('Boards table may not exist yet');
        }
    }
    
    const allBoards = [...staticBoards, ...dynamicBoards.filter(d => !staticBoards.find(s => s.slug === d.slug))];
    
    tbody.innerHTML = allBoards.map(board => `
        <tr data-testid="row-board-${board.slug}">
            <td><strong>/${board.slug}/</strong></td>
            <td>${escapeHtml(board.name)}</td>
            <td>${escapeHtml(board.description || '')}</td>
            <td>${escapeHtml(board.category)}</td>
            <td class="action-cell">
                ${board.isStatic ? 
                    '<span class="badge badge-static">Static</span>' : 
                    `<button class="btn-small btn-edit" onclick="editBoard(${board.id}, '${board.slug}')" data-testid="button-edit-board-${board.slug}">Edit</button>
                     <button class="btn-small btn-danger" onclick="deleteBoard(${board.id}, '${board.slug}')" data-testid="button-delete-board-${board.slug}">Delete</button>`
                }
            </td>
        </tr>
    `).join('');
}

async function handleBoardSubmit(e) {
    e.preventDefault();
    
    const formData = {
        slug: document.getElementById('boardSlug').value.toLowerCase(),
        name: document.getElementById('boardName').value,
        description: document.getElementById('boardDescription').value,
        category: document.getElementById('boardCategory').value
    };
    
    if (!supabaseClient) {
        alert('Supabase not configured. Cannot save board to database.');
        return;
    }
    
    try {
        if (editingBoardId) {
            const { error } = await supabaseClient
                .from('boards')
                .update(formData)
                .eq('id', editingBoardId);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('boards')
                .insert([formData]);
            if (error) throw error;
        }
        
        document.getElementById('boardModal').classList.add('hidden');
        await loadBoardsPanel();
    } catch (error) {
        alert('Error saving board: ' + error.message);
    }
}

async function editBoard(id, slug) {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('boards')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        editingBoardId = id;
        document.getElementById('boardModalTitle').textContent = 'Edit Board';
        document.getElementById('boardSlug').value = data.slug;
        document.getElementById('boardSlug').disabled = true;
        document.getElementById('boardName').value = data.name;
        document.getElementById('boardDescription').value = data.description || '';
        document.getElementById('boardCategory').value = data.category;
        document.getElementById('boardModal').classList.remove('hidden');
    } catch (error) {
        alert('Error loading board: ' + error.message);
    }
}

async function deleteBoard(id, slug) {
    showConfirm(`Are you sure you want to delete the /${slug}/ board?`, async () => {
        if (!supabaseClient) return;
        
        try {
            const { error } = await supabaseClient
                .from('boards')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await loadBoardsPanel();
        } catch (error) {
            alert('Error deleting board: ' + error.message);
        }
    });
}

async function loadThreadsPanel() {
    const tbody = document.getElementById('threadsTableBody');
    const filter = document.getElementById('threadBoardFilter');
    
    const boardOptions = Object.entries(BOARDS).map(([slug, info]) => 
        `<option value="${slug}">/${slug}/ - ${info.name}</option>`
    ).join('');
    filter.innerHTML = '<option value="">All Boards</option>' + boardOptions;
    
    filter.onchange = loadThreadsPanel;
    
    if (!supabaseClient) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Configure Supabase to manage threads</td></tr>';
        return;
    }
    
    try {
        let query = supabaseClient.from('threads').select('*').order('created_at', { ascending: false }).limit(50);
        
        const selectedBoard = filter.value;
        if (selectedBoard) {
            query = query.eq('board', selectedBoard);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No threads found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(thread => `
            <tr class="${thread.is_deleted ? 'deleted-row' : ''}" data-testid="row-thread-${thread.id}">
                <td>${thread.id}</td>
                <td>/${thread.board}/</td>
                <td>${escapeHtml(thread.subject.substring(0, 40))}${thread.subject.length > 40 ? '...' : ''}</td>
                <td>${thread.reply_count}</td>
                <td>
                    ${thread.is_sticky ? '<span class="badge badge-sticky">Sticky</span>' : ''}
                    ${thread.is_locked ? '<span class="badge badge-locked">Locked</span>' : ''}
                    ${thread.is_deleted ? '<span class="badge badge-deleted">Deleted</span>' : ''}
                </td>
                <td class="action-cell">
                    <button class="btn-small" onclick="toggleSticky(${thread.id}, ${!thread.is_sticky})" data-testid="button-sticky-${thread.id}">
                        ${thread.is_sticky ? 'Unsticky' : 'Sticky'}
                    </button>
                    <button class="btn-small" onclick="toggleLock(${thread.id}, ${!thread.is_locked})" data-testid="button-lock-${thread.id}">
                        ${thread.is_locked ? 'Unlock' : 'Lock'}
                    </button>
                    ${thread.is_deleted ? 
                        `<button class="btn-small btn-success" onclick="restoreThread(${thread.id})" data-testid="button-restore-${thread.id}">Restore</button>` :
                        `<button class="btn-small btn-danger" onclick="deleteThread(${thread.id})" data-testid="button-delete-${thread.id}">Delete</button>`
                    }
                    <a href="thread.html?board=${thread.board}&id=${thread.id}" class="btn-small" target="_blank" data-testid="link-view-${thread.id}">View</a>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="error-cell">Error: ${error.message}</td></tr>`;
    }
}

async function toggleSticky(threadId, sticky) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('threads')
            .update({ is_sticky: sticky })
            .eq('id', threadId);
        if (error) throw error;
        await loadThreadsPanel();
    } catch (error) {
        alert('Error updating thread: ' + error.message);
    }
}

async function toggleLock(threadId, locked) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('threads')
            .update({ is_locked: locked })
            .eq('id', threadId);
        if (error) throw error;
        await loadThreadsPanel();
    } catch (error) {
        alert('Error updating thread: ' + error.message);
    }
}

async function deleteThread(threadId) {
    showConfirm('Are you sure you want to delete this thread?', async () => {
        if (!supabaseClient) return;
        try {
            const { error } = await supabaseClient
                .from('threads')
                .update({ is_deleted: true })
                .eq('id', threadId);
            if (error) throw error;
            await loadThreadsPanel();
        } catch (error) {
            alert('Error deleting thread: ' + error.message);
        }
    });
}

async function restoreThread(threadId) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('threads')
            .update({ is_deleted: false })
            .eq('id', threadId);
        if (error) throw error;
        await loadThreadsPanel();
    } catch (error) {
        alert('Error restoring thread: ' + error.message);
    }
}

async function loadModerationPanel() {
    if (!supabaseClient) {
        document.getElementById('totalThreads').textContent = '-';
        document.getElementById('totalReplies').textContent = '-';
        document.getElementById('deletedItems').textContent = '-';
        document.getElementById('recentActivity').innerHTML = '<p>Configure Supabase to view moderation stats</p>';
        return;
    }
    
    try {
        const { count: threadCount } = await supabaseClient
            .from('threads')
            .select('*', { count: 'exact', head: true });
        
        const { count: replyCount } = await supabaseClient
            .from('replies')
            .select('*', { count: 'exact', head: true });
        
        const { count: deletedThreads } = await supabaseClient
            .from('threads')
            .select('*', { count: 'exact', head: true })
            .eq('is_deleted', true);
        
        const { count: deletedReplies } = await supabaseClient
            .from('replies')
            .select('*', { count: 'exact', head: true })
            .eq('is_deleted', true);
        
        document.getElementById('totalThreads').textContent = threadCount || 0;
        document.getElementById('totalReplies').textContent = replyCount || 0;
        document.getElementById('deletedItems').textContent = (deletedThreads || 0) + (deletedReplies || 0);
        
        const { data: recentThreads } = await supabaseClient
            .from('threads')
            .select('id, board, subject, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (recentThreads && recentThreads.length > 0) {
            document.getElementById('recentActivity').innerHTML = recentThreads.map(t => `
                <div class="activity-item">
                    <span class="activity-type">Thread</span>
                    <a href="thread.html?board=${t.board}&id=${t.id}" target="_blank">/${t.board}/ - ${escapeHtml(t.subject.substring(0, 30))}</a>
                    <span class="activity-time">${formatDate(t.created_at)}</span>
                </div>
            `).join('');
        } else {
            document.getElementById('recentActivity').innerHTML = '<p>No recent activity</p>';
        }
    } catch (error) {
        console.error('Error loading moderation stats:', error);
    }
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmMessage').textContent = message;
    modal.classList.remove('hidden');
    
    document.getElementById('confirmOk').onclick = () => {
        modal.classList.add('hidden');
        onConfirm();
    };
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
}
