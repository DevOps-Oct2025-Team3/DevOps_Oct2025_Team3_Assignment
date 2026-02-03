
const API_BASE = 'http://localhost:3000'; 
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role')
const views = {
    login: document.getElementById('loginView'),
    admin: document.getElementById('adminView'),
    user: document.getElementById('userView')
};
const navLogout = document.getElementById('logoutBtn');
const alertBox = document.getElementById('alertBox');

function init() {
if (token) {
    showDashboard(userRole);
    } else {
    showView('login');
    }
}

function showView(viewName) {
    // Hide all views
    Object.values(views).forEach(el => el.classList.add('hidden'));
    navLogout.classList.add('hidden');
    alertBox.classList.add('hidden');

    // Show requested view
    views[viewName].classList.remove('hidden');

    if (viewName !== 'login') {
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

function showAlert(msg, type = 'danger') {
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 3000);
}

// --- AUTHENTICATION ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Username: username, Password: password })
        });

        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        
        token = data.token;
        userRole = data.role; 
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);

        showDashboard(userRole);
    } catch (err) {
        showAlert('Invalid credentials');
        console.error(err);
    }
});

navLogout.addEventListener('click', () => {
    localStorage.clear();
    token = null;
    userRole = null;
    showView('login');
});

// --- ADMIN FUNCTIONS ---
async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE}/admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();
        
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '';
        users.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.UserId}</td>
                    <td>${u.Username}</td>
                    <td>${u.Role}</td>
                    <td>
                        <button onclick="deleteUser(${u.UserId})" class="btn btn-sm btn-danger">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showAlert('Failed to load users');
    }
}

document.getElementById('createUserForm').addEventListener('submit', async (e) => {
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
            body: JSON.stringify({ Username: username, Password: password, Role: role })
        });
        loadUsers(); // Refresh list
        e.target.reset();
        showAlert('User created', 'success');
    } catch (err) {
        showAlert('Failed to create user');
    }
});

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

async function loadFiles() {
    try {
        const res = await fetch(`${API_BASE}/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const files = await res.json();
        
        const tbody = document.getElementById('fileTableBody');
        tbody.innerHTML = '';
        files.forEach(f => {
            tbody.innerHTML += `
                <tr>
                    <td>${f.filename}</td>
                    <td>${f.size}</td>
                    <td>${new Date(f.uploaded_at).toLocaleDateString()}</td>
                    <td>
                        <a href="${API_BASE}/files/${f.id}/download" class="btn btn-sm btn-primary">Download</a>
                        <button onclick="deleteFile(${f.id})" class="btn btn-sm btn-danger">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showAlert('Failed to load files');
    }
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
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

init();