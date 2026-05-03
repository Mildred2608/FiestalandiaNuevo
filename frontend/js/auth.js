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
            // Guardar datos
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Disparar evento de login
            window.dispatchEvent(new CustomEvent('userLogin', { detail: data.user }));

            // REDIRIGIR SEGÚN ROL
            if (data.user.rol === 'admin') {
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
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            window.dispatchEvent(new CustomEvent('userLogin', { detail: data.user }));
            
            // Redirigir según rol después del registro
            if (data.user.rol === 'admin') {
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

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
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
    isValidPhone: isValidPhone
};