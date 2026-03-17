// backend/src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// ============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ============================================

// Obtener todas las categorías para el inicio
router.get('/categorias', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, imagen_url 
            FROM categorias 
            ORDER BY nombre
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener categorías' 
        });
    }
});

// ============================================
// RUTAS QUE USAN LAS NUEVAS VISTAS
// ============================================

// Obtener servicios públicos (usando la vista)
router.get('/servicios/publicos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_servicios_publicos');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener servicios públicos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener servicios' 
        });
    }
});

// Obtener subcategorías por categoría
router.get('/subcategorias/categoria/:categoriaId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, imagen_url 
            FROM subcategorias 
            WHERE categoria_id = ? 
            ORDER BY nombre
        `, [req.params.categoriaId]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener subcategorías:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener subcategorías' 
        });
    }
});

// Obtener servicios por subcategoría
router.get('/servicios/subcategoria/:subcategoriaId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, p.nombre as proveedor_nombre
            FROM servicios s
            LEFT JOIN proveedores p ON s.proveedor_id = p.id
            WHERE s.subcategoria_id = ? AND s.activo = 1
            ORDER BY s.nombre
        `, [req.params.subcategoriaId]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener servicios por subcategoría:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener servicios' 
        });
    }
});

// Obtener el primer servicio de una categoría (para botón "Agregar")
router.get('/servicios/categoria/:categoriaId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.id, s.nombre, s.descripcion, s.precio_base
            FROM servicios s
            LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id
            WHERE sc.categoria_id = ? AND s.activo = 1
            LIMIT 1
        `, [req.params.categoriaId]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener servicio por categoría:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener servicio' 
        });
    }
});

module.exports = router;