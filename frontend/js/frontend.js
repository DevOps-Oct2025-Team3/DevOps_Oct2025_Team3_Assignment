// 1. DEFINE API GATEWAY URL
const API_BASE = 'http://localhost:3000'; 

let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role');

// --- HELPER: Check for token expiration ---
function handleTokenExpiration(response) {
    if (response.status === 401 || response.status === 403) {
        // Token is invalid or expired
        localStorage.clear();
        token = null;
        userRole = null;
        if (views.login) {
            showView('login');
            showAlert('Session expired. Please login again.', 'warning');
        } else {
            window.location.href = 'index.html';
        }
        return true;
    }
    return false;
}

// --- DOM ELEMENTS ---
const views = {
    login: document.getElementById('loginView'),
    admin: document.getElementById('adminView'),
    user: document.getElementById('userView')
};

const navLogout = document.getElementById('logoutBtn');
const alertBox = document.getElementById('alertBox'); 
const dashboardAlert = document.getElementById('dashboardAlert'); 
const registerAlert = document.getElementById('registerAlert'); 

// --- INIT LOGIC ---
function init() {
    // If a token exists, show the appropriate dashboard regardless
    // of whether the login view exists on the current page.
    if (token) {
        if (!userRole) {
            const decoded = parseJwt(token);
            if (decoded) userRole = decoded.role;
        }
        showDashboard(userRole);
        return;
    }

    // No token: if the login view is present on this page, show it.
    if (views.login) {
        showView('login');
        return;
    }

    // No login view and no token: navigate back to the main login page.
    // This ensures standalone dashboard pages redirect to login when unauthenticated.
    try {
        window.location.href = 'index.html';
    } catch (e) {
        /* noop in non-browser environments */
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
    const loginView = document.getElementById('loginView');
    const navbar = document.getElementById('navbar');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const body = document.body;
    
    if (viewName === 'login') {
        if (loginView) loginView.classList.remove('hidden');
        if (navbar) navbar.classList.add('hidden');
        if (dashboardContainer) dashboardContainer.classList.add('hidden');
        body.className = 'login-page';
    } else {
        if (loginView) loginView.classList.add('hidden');
        if (navbar) navbar.classList.remove('hidden');
        if (dashboardContainer) dashboardContainer.classList.remove('hidden');
        body.className = 'dashboard-page';
        
        if (!views[viewName]) return;
        Object.values(views).forEach(el => {
            if (el) el.classList.add('hidden');
        });
        if (views[viewName]) views[viewName].classList.remove('hidden');
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

function showAlert(msg, type = 'danger', targetElement = null) {
    const el = targetElement || dashboardAlert || alertBox || registerAlert;
    
    if (el) {
        el.textContent = msg;
        el.className = `alert alert-${type}`;
        el.classList.remove('hidden');
        el.style.display = 'block'; 
        
        setTimeout(() => {
            el.classList.add('hidden');
            el.style.display = 'none';
        }, 3000);
    } else {
        console.warn("Alert element not found for message:", msg);
    }
}

// --- EVENT LISTENERS ---

// LOGIN FORM
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // User paths remain the same
            const response = await fetch(`${API_BASE}/users/login`, {
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

// LOGOUT BUTTON
const logoutLink = document.getElementById('logoutLink');
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        token = null;
        userRole = null;
        showView('login');
    });
}
if (navLogout) {
    navLogout.addEventListener('click', () => {
        localStorage.clear();
        token = null;
        userRole = null;
        showView('login');
    });
}

// CREATE USER FORM (Admin Dashboard)
const createUserForm = document.getElementById('createUserForm');
if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        try {
            const response = await fetch(`${API_BASE}/users/admin/create_user`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, password, role })
            });

            if (handleTokenExpiration(response)) return;

            const data = await response.json();
            
            if (!response.ok) {
                showAlert(data.message || data.error || 'Failed to create user', 'danger');
                return; 
            }

            loadUsers(); 
            e.target.reset();
            showAlert('User created successfully', 'success');
        } catch (err) {
            console.error('Create user error:', err);
            showAlert(err.message || 'Failed to create user', 'danger');
        }
    });
}

// UPLOAD FORM (User Dashboard)
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('fileInput');
        if (!fileInput.files || !fileInput.files[0]) {
            showAlert('Please select a file to upload', 'warning');
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
            
            const response = await fetch(`${API_BASE}/files/dashboard/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (handleTokenExpiration(response)) return;
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Upload failed with status ${response.status}`);
            }
            
            const uploadedFile = await response.json();
            console.log('File uploaded successfully:', uploadedFile);
            
            loadFiles();
            e.target.reset();
            showAlert(`File "${file.name}" uploaded successfully`, 'success');
        } catch (err) {
            console.error('Upload error:', err);
            showAlert(`Upload failed: ${err.message || 'Unknown error'}`, 'danger');
        }
    });
}

// --- DATA LOADERS ---

async function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/users/admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (handleTokenExpiration(res)) return;
        
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
        const res = await fetch(`${API_BASE}/files/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (handleTokenExpiration(res)) return;
        
        if (!res.ok) {
            throw new Error(`Failed to load files: ${res.status}`);
        }
        
        const files = await res.json();
        console.log(`[loadFiles] Loaded ${files.length} files`);
        
        tbody.innerHTML = '';
        files.forEach(f => {
            const fileSize = f.FileSize ? (f.FileSize / 1024).toFixed(2) + ' KB' : 'Unknown';
            tbody.innerHTML += `
                <tr>
                    <td>${f.FileName}</td>
                    <td>${fileSize}</td>
                    <td>${new Date(f.UploadedAt).toLocaleDateString()}</td>
                    <td>
                        <button onclick="downloadFile('${f._id}', '${f.FileName.replace(/'/g, "\\'")}')" class="btn btn-sm btn-primary">Download</button>
                        <button onclick="deleteFile('${f._id}')" class="btn btn-sm btn-danger">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('[loadFiles] Error:', err);
        showAlert('Failed to load files', 'danger');
    }
}

// Download function with Authorization header
async function downloadFile(fileId, fileName) {
    try {
        const response = await fetch(`${API_BASE}/files/dashboard/download/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (handleTokenExpiration(response)) return;

        if (!response.ok) {
            showAlert('Download failed: ' + response.statusText);
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) {
        console.error('Download error:', err);
        showAlert('Download failed');
    }
}

// --- GLOBAL ACTIONS ---

window.deleteUser = async (id) => {
    if(!confirm("Are you sure?")) return;
    try {
        const response = await fetch(`${API_BASE}/users/admin/delete_user/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (handleTokenExpiration(response)) return;
        
        const data = await response.json();
        
        if (!response.ok) {
            showAlert(data.message || 'Failed to delete user', 'danger');
            return;
        }
        
        showAlert('User deleted successfully', 'success');
        loadUsers();
    } catch (err) {
        console.error('Delete user error:', err);
        showAlert('Failed to delete user', 'danger');
    }
};

window.deleteFile = async (id) => {
    if(!confirm("Delete this file?")) return;
    try {
        // FIXED: Changed files/files to just /files
        const response = await fetch(`${API_BASE}/files/dashboard/delete/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (handleTokenExpiration(response)) return;
        
        loadFiles();
    } catch (err) {
        showAlert('Failed to delete file');
    }
};

window.downloadFile = async (id, fallbackName = 'download') => {
    try {
        // Request the file with auth since the endpoint is protected.
        const response = await fetch(`${API_BASE}/files/dashboard/download/${id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // If the token expired, the helper handles redirect/alert.
        if (handleTokenExpiration(response)) return;

        if (!response.ok) {
            showAlert('Download failed');
            return;
        }

        // Extract mime type + filename for a proper download prompt.
        const type = response.headers.get('content-type') || 'application/octet-stream';
        const disposition = response.headers.get('content-disposition') || '';
        const match = disposition.match(/filename="?([^";]+)"?/i);
        const filename = match ? match[1] : fallbackName;

        // Build a Blob from the response bytes and create a temporary URL.
        const data = await response.arrayBuffer();
        const blob = new Blob([data], { type: type });
        const url = URL.createObjectURL(blob);

        // Trigger a browser download by clicking a temporary anchor element.
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        showAlert('Download failed');
    }
};

// Start the app
init();