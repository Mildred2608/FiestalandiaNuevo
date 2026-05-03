// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta de login
router.post('/login', authController.login);

// Ruta de registro
router.post('/register', authController.register);

// Esta ruta debe ser eliminada después de usar
router.post('/create-admin', authController.createFirstAdmin);


// Agrega esta función para redirigir después del login
function redirigirPorRol(user) {
    if (user.rol === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Modifica tu función de login (debe verse similar a esto)
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Guardar token y usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirigir según el rol
            redirigirPorRol(data.user);  // ← CRUCIAL
            
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        return { success: false, message: 'Error de conexión' };
    }
}

module.exports = router;




