// Admin authentication
function validateCredentials(username, password) {
    const expectedUser = 'CTCA';
    const expectedPass = 'drayfrick12';
    return username === expectedUser && password === expectedPass;
}

function setAdminSession() {
    const expiry = Date.now() + (24 * 60 * 60 * 1000);
    const sessionData = {
        authenticated: true,
        expiry: expiry
    };
    sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
}

function isAdminAuthenticated() {
    const sessionData = sessionStorage.getItem('adminSession');
    if (!sessionData) return false;
    
    try {
        const session = JSON.parse(sessionData);
        if (session.authenticated && session.expiry > Date.now()) {
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

function clearAdminSession() {
    sessionStorage.removeItem('adminSession');
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('adminLoginForm');
    const errorMsg = document.getElementById('errorMsg');
    
    if (isAdminAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (validateCredentials(username, password)) {
            setAdminSession();
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = 'Invalid credentials';
            errorMsg.style.display = 'block';
            document.getElementById('password').value = '';
        }
    });
});
