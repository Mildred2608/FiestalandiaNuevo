// src/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar conexión a BD y rutas
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: 'API de Fiestalandia funcionando ',
        status: 'OK',
        endpoints: {
            login: 'POST /api/auth/login',
            register: 'POST /api/auth/register'
        },
        timestamp: new Date().toISOString()
    });
});

// Ruta para probar la BD
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

module.exports = app;