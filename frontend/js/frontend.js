let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role');

const API_BASE = 'http://localhost:4001'; 

// --- DOM ELEMENTS ---
// We use 'try/catch' or simple null checks later to prevent crashes
const views = {
    login: document.getElementById('loginView'),
    admin: document.getElementById('adminView'),
    user: document.getElementById('userView')
};

const navLogout = document.getElementById('logoutBtn');
const alertBox = document.getElementById('alertBox'); // Used in index.html
const registerAlert = document.getElementById('registerAlert'); // Used in register.html

// --- INIT LOGIC ---
function init() {
    // Only run dashboard logic if we are on index.html (where views.login exists)
    if (views.login) {
        if (token) {
            if (!userRole) {
                const decoded = parseJwt(token);
                if (decoded) userRole = decoded.role;
            }
            showDashboard(userRole);
        } else {
            showView('login');
        }
    }
}

// --- HELPER FUNCTIONS ---
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function showView(viewName) {
    if (!views[viewName]) return; // Guard clause

    // Hide all views
    Object.values(views).forEach(el => {
        if (el) el.classList.add('hidden');
    });

    if (navLogout) navLogout.classList.add('hidden');
    if (alertBox) alertBox.classList.add('hidden');

    // Show requested view
    views[viewName].classList.remove('hidden');

    if (viewName !== 'login' && navLogout) {
        navLogout.classList.remove('hidden');
    }
}

function showDashboard(role) {
    if (role === 'Admin') {
        showView('admin');
        loadUsers();
    } else {
        showView('user');
        loadFiles();
    }
}

// Global Alert Helper (Handles both index.html and register.html alerts)
function showAlert(msg, type = 'danger', targetElement = null) {
    // If a specific target is passed, use it. Otherwise default to the main alertBox.
    const el = targetElement || alertBox || registerAlert;
    
    if (el) {
        el.textContent = msg;
        el.className = `alert alert-${type}`;
        el.classList.remove('hidden');
        el.style.display = 'block'; // Ensure it's visible if using style='display:none'
        
        setTimeout(() => {
            el.classList.add('hidden');
            el.style.display = 'none';
        }, 3000);
    } else {
        console.warn("Alert element not found for message:", msg);
    }
}

// --- EVENT LISTENERS (WRAPPED IN CHECKS) ---

// 1. LOGIN FORM
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }) 
            });

            if (!response.ok) throw new Error('Login failed');
            
            const data = await response.json();
            token = data.token;
            
            const decoded = parseJwt(token);
            userRole = decoded ? decoded.role : 'User';

            localStorage.setItem('token', token);
            localStorage.setItem('role', userRole);

            showDashboard(userRole);
        } catch (err) {
            showAlert('Invalid credentials');
            console.error(err);
        }
    });
}

// 2. LOGOUT BUTTON
if (navLogout) {
    navLogout.addEventListener('click', () => {
        localStorage.clear();
        token = null;
        userRole = null;
        showView('login');
    });
}

// 3. REGISTER FORM (For register.html)
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'User' })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Registration failed');

            showAlert('Account created! Redirecting...', 'success', registerAlert);
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (err) {
            showAlert(err.message, 'danger', registerAlert);
        }
    });
}

// 4. CREATE USER FORM (Admin Dashboard)
const createUserForm = document.getElementById('createUserForm');
if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        try {
            await fetch(`${API_BASE}/admin/create_user`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, password, role })
            });
            loadUsers(); 
            e.target.reset();
            showAlert('User created', 'success');
        } catch (err) {
            showAlert('Failed to create user');
        }
    });
}

// 5. UPLOAD FORM (User Dashboard)
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', document.getElementById('fileInput').files[0]);

        try {
            await fetch(`${API_BASE}/files`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            loadFiles();
            e.target.reset();
            showAlert('File uploaded', 'success');
        } catch (err) {
            showAlert('Upload failed');
        }
    });
}

// --- DATA LOADERS ---

async function loadUsers() {
    // Safety check: Don't load if table doesn't exist
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();
        
        tbody.innerHTML = '';
        users.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.userId}</td>
                    <td>${u.username}</td>
                    <td>${u.role}</td>
                    <td>
                        <button onclick="deleteUser('${u.userId}')" class="btn btn-sm btn-danger">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        showAlert('Failed to load users');
    }
}

async function loadFiles() {
    const tbody = document.getElementById('fileTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const files = await res.json();
        
        tbody.innerHTML = '';
        files.forEach(f => {
            tbody.innerHTML += `
                <tr>
                    <td>${f.fileName}</td>
                    <td>${f.fileSize}</td>
                    <td>${new Date(f.uploadedAt).toLocaleDateString()}</td>
                    <td>
                        <a href="${API_BASE}/files/${f._id}/download" class="btn btn-sm btn-primary">Download</a>
                        <button onclick="deleteFile('${f._id}')" class="btn btn-sm btn-danger">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showAlert('Failed to load files');
    }
}

// --- GLOBAL ACTIONS (Attached to Window for HTML onclick attributes) ---

window.deleteUser = async (id) => {
    if(!confirm("Are you sure?")) return;
    try {
        await fetch(`${API_BASE}/admin/delete_user/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadUsers();
    } catch (err) {
        showAlert('Failed to delete user');
    }
};

window.deleteFile = async (id) => {
    if(!confirm("Delete this file?")) return;
    try {
        await fetch(`${API_BASE}/files/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadFiles();
    } catch (err) {
        showAlert('Failed to delete file');
    }
};

// Start the app
init();