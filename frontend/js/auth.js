// frontend/js/auth.js
const API_URL = 'http://localhost:3000/api';

// ===== VALIDACIONES =====
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^\d{10}$/;
    return re.test(phone.replace(/\D/g, ''));
}

// ===== FUNCIONES DE AUTENTICACIÓN =====

// Función de login - redirige según rol
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Asegurar compatibilidad con user.rol para las vistas existentes
            const normalizedUser = normalizeUser(data.user);

            // Guardar datos
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(normalizedUser));

            // Disparar evento de login
            window.dispatchEvent(new CustomEvent('userLogin', { detail: normalizedUser }));

            // REDIRIGIR SEGÚN ROL - Admin va a admin.html, otros a index.html
            if (normalizedUser.roles.includes('admin')) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }

            return { success: true };
        } else {
            return { success: false, error: data.message || 'Error al iniciar sesión' };
        }
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: 'Error de conexión' };
    }
}

// Alias para mantener compatibilidad
async function loginUser(email, password) {
    return login(email, password);
}

async function register(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            const normalizedUser = normalizeUser(data.user);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            
            window.dispatchEvent(new CustomEvent('userLogin', { detail: normalizedUser }));
            
            // Redirigir según rol después del registro - Admin va a admin.html, otros a index.html
            if (normalizedUser.roles.includes('admin')) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
            
            return { success: true, data };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('Error en registro:', error);
        return { success: false, error: 'Error de conexión con el servidor' };
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLogout'));
    window.location.href = 'index.html';
}

function normalizeUser(user) {
    if (!user) return null;

    const roles = user.roles || (user.rol ? [user.rol] : []);
    const normalizedRoles = Array.isArray(roles)
        ? roles
        : String(roles).split(',').map(r => r.trim()).filter(Boolean);

    user.roles = normalizedRoles;
    user.rol = user.rol || (normalizedRoles.includes('admin') ? 'admin' : normalizedRoles[0] || 'cliente');

    return user;
}

function getCurrentUser() {
    const userData = localStorage.getItem('user');
    if (!userData) return null;

    try {
        const user = JSON.parse(userData);
        return normalizeUser(user);
    } catch (error) {
        console.error('Error parseando user desde localStorage:', error);
        return null;
    }
}

// ===== FUNCIONES DE VERIFICACIÓN DE ROLES =====

// Obtener roles del usuario (como array)
function getUserRoles() {
    const user = getCurrentUser();
    if (!user) return [];
    return user.roles;
}

// Verificar si el usuario tiene un rol específico
function hasRole(role) {
    const roles = getUserRoles();
    return roles.includes(role);
}

// Verificar si es admin
function isAdmin() {
    return hasRole('admin');
}

// Verificar si es proveedor
function isProveedor() {
    return hasRole('proveedor');
}

// Verificar si es cliente
function isCliente() {
    return hasRole('cliente');
}

function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Exponer funciones globalmente
window.auth = {
    login: login,
    register: register,
    logout: logout,
    getCurrentUser: getCurrentUser,
    isAuthenticated: isAuthenticated,
    isValidEmail: isValidEmail,
    isValidPhone: isValidPhone,
    // Nuevas funciones de roles
    getUserRoles: getUserRoles,
    hasRole: hasRole,
    isAdmin: isAdmin,
    isProveedor: isProveedor,
    isCliente: isCliente
};