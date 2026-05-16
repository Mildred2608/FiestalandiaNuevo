// backend/src/routes/proveedorRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, isProveedor } = require('../middlewares/authMiddleware');

// Helper interno: Obtener de forma segura el ID de proveedor comercial usando el email del token JWT
const obtenerProveedorIdPorEmail = async (email) => {
    const [rows] = await pool.query('SELECT id FROM proveedores WHERE email = ?', [email]);
    return rows.length > 0 ? rows[0].id : null;
};

// =========================================================================
// 🏢 ENDPOINT: RESUMEN GENERAL PARA DASHBOARD PROVEEDOR
// =========================================================================
router.get('/resumen', verifyToken, isProveedor, async (req, res) => {
    try {
        const proveedorId = await obtenerProveedorIdPorEmail(req.user.email);
        if (!proveedorId) {
            return res.status(404).json({ success: false, message: 'Perfil de proveedor no encontrado.' });
        }

        // 1. Contador de servicios activos
        const [serviciosCount] = await pool.query(
            "SELECT COUNT(*) as total FROM servicios WHERE proveedor_id = ? AND estado = 'activo'",
            [proveedorId]
        );

        // 2. Contador de cotizaciones pendientes
        const [cotizacionesCount] = await pool.query(
            "SELECT COUNT(*) as total FROM solicitudes_cliente_servicio scs JOIN servicios s ON scs.servicio_id = s.id WHERE s.proveedor_id = ? AND scs.estado = 'pendiente'",
            [proveedorId]
        );

        // 3. Lista de últimas solicitudes entrantes
        const [solicitudes] = await pool.query(`
            SELECT scs.id, s.nombre as nombre_servicio, cl.nombre as nombre_evento, scs.fecha_evento
            FROM solicitudes_cliente_servicio scs
            JOIN servicios s ON scs.servicio_id = s.id
            JOIN clientes cl ON scs.cliente_id = cl.id
            WHERE s.proveedor_id = ? AND scs.estado = 'pendiente'
            ORDER BY scs.fecha_solicitud DESC LIMIT 5
        `, [proveedorId]);

        res.json({
            success: true,
            stats: {
                totalServicios: serviciosCount[0].total,
                totalCotizaciones: cotizacionesCount[0].total
            },
            cotizaciones: solicitudes
        });
    } catch (error) {
        console.error('Error al obtener el resumen del proveedor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// =========================================================================
// 📦 TAB DE SERVICIOS: OBTENER LOS SERVICIOS DEL PROVEEDOR
// =========================================================================
router.get('/servicios/proveedor/:userId', verifyToken, isProveedor, async (req, res) => {
    try {
        const proveedorId = await obtenerProveedorIdPorEmail(req.user.email);
        if (!proveedorId) {
            return res.json([]); // Si no existe el proveedor, devolvemos un arreglo vacío nativo
        }

        const [rows] = await pool.query(`
            SELECT s.*, sc.nombre as subcategoria_nombre, c.nombre as categoria_nombre 
            FROM servicios s 
            LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id 
            LEFT JOIN categorias c ON sc.categoria_id = c.id 
            WHERE s.proveedor_id = ? 
            ORDER BY s.id DESC
        `, [proveedorId]);

        // IMPORTANTE: Retornamos el array directamente sin envolver en objetos, tal como lo pide tu frontend
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los servicios del proveedor:', error);
        res.json([]); // Fallback seguro para evitar romper el bucle .map() del frontend
    }
});

// Registrar nuevo servicio comercial
router.post('/servicios', verifyToken, isProveedor, async (req, res) => {
    try {
        const { nombre, categoria_id, subcategoria_id, precio_base, descripcion } = req.body;
        const proveedorId = await obtenerProveedorIdPorEmail(req.user.email);

        if (!proveedorId) {
            return res.status(404).json({ success: false, message: 'No se pudo asociar el perfil de proveedor.' });
        }

        const [result] = await pool.query(`
            INSERT INTO servicios 
            (proveedor_id, nombre, categoria_id, subcategoria_id, precio_base, descripcion, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'activo')
        `, [proveedorId, nombre, categoria_id, subcategoria_id, precio_base, descripcion]);

        res.status(201).json({ 
            success: true, 
            message: 'Servicio registrado exitosamente',
            servicioId: result.insertId
        });
    } catch (error) {
        console.error('Error al registrar servicio:', error);
        res.status(500).json({ success: false, message: 'Error al registrar servicio' });
    }
});

// =========================================================================
// 💰 TAB DE COTIZACIONES: OBTENER COTIZACIONES ENVIADAS POR EL PROVEEDOR
// =========================================================================
router.get('/cotizaciones/proveedor/:userId', verifyToken, isProveedor, async (req, res) => {
    try {
        const proveedorId = await obtenerProveedorIdPorEmail(req.user.email);
        if (!proveedorId) return res.json([]);

        // Corrección de columnas: cambiado c.fecha_creacion por c.creado_en según el esquema de tu base de datos
        const [rows] = await pool.query(`
            SELECT c.id, c.precio, c.estado, c.creado_en as fecha_creacion, 
                   s.nombre as servicio_nombre,
                   cl.nombre as cliente_nombre
            FROM cotizaciones c
            JOIN solicitudes_cliente_servicio scs ON c.solicitud_id = scs.id
            JOIN servicios s ON scs.servicio_id = s.id
            JOIN clientes cl ON scs.cliente_id = cl.id
            WHERE c.proveedor_id = ?
            ORDER BY c.id DESC
        `, [proveedorId]);

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cotizaciones del proveedor:', error);
        res.json([]);
    }
});

// Enviar presupuesto / crear cotización para una solicitud activa
router.post('/cotizaciones', verifyToken, isProveedor, async (req, res) => {
    try {
        const { solicitud_id, precio, mensaje } = req.body;
        const proveedorId = await obtenerProveedorIdPorEmail(req.user.email);

        const [solicitud] = await pool.query(`
            SELECT scs.*, s.proveedor_id 
            FROM solicitudes_cliente_servicio scs
            JOIN servicios s ON scs.servicio_id = s.id
            WHERE scs.id = ?
        `, [solicitud_id]);

        if (solicitud.length === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        if (solicitud[0].estado !== 'pendiente') {
            return res.status(400).json({ message: 'La solicitud ya no está disponible' });
        }

        const [result] = await pool.query(`
            INSERT INTO cotizaciones (solicitud_id, proveedor_id, precio, mensaje, estado)
            VALUES (?, ?, ?, ?, 'pendiente')
        `, [solicitud_id, proveedorId, precio, mensaje]);

        res.status(201).json({ 
            success: true, 
            message: 'Cotización enviada exitosamente',
            cotizacionId: result.insertId
        });
    } catch (error) {
        console.error('Error al enviar cotización:', error);
        res.status(500).json({ success: false, message: 'Error al enviar cotización' });
    }
});

// =========================================================================
// 📥 TAB DE SOLICITUDES: OBTENER SOLICITUDES DISPONIBLES PARA COTIZAR
// =========================================================================
router.get('/solicitudes/disponibles', verifyToken, isProveedor, async (req, res) => {
    try {
        // Corrección de alias: mapeamos scs.creado_en como fecha_creacion para mantener compatibilidad nativa con proveedor.js
        const [rows] = await pool.query(`
            SELECT scs.id, scs.mensaje as detalles, scs.fecha_solicitud as fecha_creacion, scs.estado,
                   s.nombre as servicio_solicitado,
                   c.nombre as cliente_nombre
            FROM solicitudes_cliente_servicio scs
            JOIN servicios s ON scs.servicio_id = s.id
            JOIN clientes c ON scs.cliente_id = c.id
            WHERE scs.estado = 'pendiente'
            ORDER BY scs.fecha_solicitud DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener solicitudes disponibles:', error);
        res.json([]);
    }
});

module.exports = router;