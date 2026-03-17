// backend/src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar conexión a BD
const { testConnection } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Probar conexión a BD
testConnection();

// ============================================
// RUTAS DE LA API
// ============================================

// Rutas de autenticación (públicas)
app.use('/api/auth', authRoutes);

// Rutas de administrador (protegidas)
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes); 

// ============================================
// RUTA DE BIENVENIDA
// ============================================
app.get('/', (req, res) => {
    res.json({
        message: 'API de Fiestalandia funcionando ',
        status: 'OK',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register'
            },
            admin: {
                categorias: 'GET /api/admin/categorias',
                proveedores: 'GET /api/admin/proveedores',
                servicios: 'POST /api/admin/servicios'
            }
        },
        timestamp: new Date().toISOString()
    });
});

// ============================================
// RUTA PARA PROBAR CONEXIÓN A BD
// ============================================
app.get('/api/test-db', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        const [rows] = await pool.query('SELECT NOW() as currentTime');
        res.json({
            success: true,
            message: 'Conexión a BD exitosa',
            time: rows[0].currentTime
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error conectando a BD',
            error: error.message
        });
    }
});

// ============================================
// MANEJO DE ERRORES 404
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
    console.error('Error global:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;