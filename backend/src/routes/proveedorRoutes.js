// backend/src/routes/proveedorRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

// VERIFICAR QUE EL USUARIO SEA PROVEEDOR O ADMIN
const isProveedor = authMiddleware.hasRole('proveedor');

// OBTENER LOS SERVICIOS DEL PROVEEDOR
router.get('/servicios/proveedor/:proveedorId', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const { proveedorId } = req.params;

        // Verificar que el usuario solo acceda a sus propios servicios (o admin)
        const userRoles = Array.isArray(req.user.roles) 
            ? req.user.roles 
            : (req.user.rol ? [req.user.rol] : []);
        
        if (!userRoles.includes('admin') && req.user.id != proveedorId) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const [rows] = await pool.query(
            `SELECT s.*, sc.nombre as subcategoria_nombre, c.nombre as categoria_nombre 
             FROM servicios s 
             LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id 
             LEFT JOIN categorias c ON sc.categoria_id = c.id 
             WHERE s.proveedor_id = ? 
             ORDER BY s.id DESC`, 
            [proveedorId]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los servicios del proveedor:', error);
        res.status(500).json({
            success: false, 
            message: 'Error al obtener servicios'
        });
    }
});

// Obtener solicitudes de clientes para servicios del proveedor
router.get('/solicitudes', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        //obtener el id del proveedor
        const [proveedor] = await pool.query(
            'SELECT * FROM proveedores WHERE email = ?',
            [req.user.email]
        );

        if(proveedor.length === 0) {
            return res.json([]);
        }

        const [rows] = await pool.query(`
            SELECT sc.*, 
                   s.nombre as servicio_nombre,
                   c.nombre as cliente_nombre,
                   c.email as cliente_email,
                   c.telefono as cliente_telefono
            FROM solicitudes_cliente_servicio sc
            JOIN servicios s ON sc.servicio_id = s.id
            JOIN clientes c ON sc.cliente_id = c.id
            WHERE s.proveedor_id = ?
            ORDER BY sc.fecha_solicitud DESC
        `, [proveedor[0].id]);

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener solicitudes del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las solicitudes del cliente'
        });

    }
});


// PROVEEDOR: ACEPTAR SOLICITUD DE CLIENTE
router.post('/solicitudes/:id/aceptar', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(
            `UPDATE solicitudes_cliente_servicio 
             SET estado = 'aceptada', fecha_atencion = NOW()
             WHERE id = ?`,
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Solicitud aceptada' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al aceptar solicitud' 
        });
    }
});


// PROVEEDOR: RECHAZAR SOLICITUD DE CLIENTE
router.post('/solicitudes/:id/rechazar', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(
            `UPDATE solicitudes_cliente_servicio 
             SET estado = 'rechazada', fecha_atencion = NOW()
             WHERE id = ?`,
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Solicitud rechazada' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al rechazar solicitud' 
        });
    }
});


// OBTENER COTIZACIONES DONDE APARECEN MIS SERVICIOS
router.get('/cotizaciones', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const [proveedor] = await pool.query(
            'SELECT id FROM proveedores WHERE email = ?',
            [req.user.email]
        );
        
        if (proveedor.length === 0) {
            return res.json([]);
        }
        
        const [rows] = await pool.query(`
            SELECT DISTINCT 
                c.id as cotizacion_id,
                c.total,
                c.estado,
                c.creado_en,
                cl.nombre as cliente_nombre,
                cl.email as cliente_email
            FROM cotizaciones c
            JOIN detalle_cotizacion dc ON c.id = dc.cotizacion_id
            JOIN servicios s ON dc.servicio_id = s.id
            JOIN clientes cl ON e.cliente_id = cl.id
            JOIN eventos e ON c.evento_id = e.id
            WHERE s.proveedor_id = ?
            ORDER BY c.id DESC
        `, [proveedor[0].id]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotizaciones' 
        });
    }
});


// CLIENTE: SOLICITAR UN SERVICIO A UN PROVEEDOR
router.post('/solicitar-servicio', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { servicio_id, fecha_evento, cantidad, mensaje } = req.body;
        
        await pool.query(
            `INSERT INTO solicitudes_cliente_servicio 
             (servicio_id, cliente_id, fecha_evento, cantidad, mensaje, estado)
             VALUES (?, ?, ?, ?, ?, 'pendiente')`,
            [servicio_id, req.user.id, fecha_evento || null, cantidad || 1, mensaje || null]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Solicitud enviada al proveedor' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al enviar solicitud' 
        });
    }
});

module.exports = router;

// ===== NUEVAS RUTAS PARA PANEL DE PROVEEDOR =====

// OBTENER COTIZACIONES ENVIADAS POR EL PROVEEDOR
router.get('/cotizaciones/proveedor/:proveedorId', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const { proveedorId } = req.params;

        // Verificar acceso
        const userRoles = Array.isArray(req.user.roles) 
            ? req.user.roles 
            : (req.user.rol ? [req.user.rol] : []);
        
        if (!userRoles.includes('admin') && req.user.id != proveedorId) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const [rows] = await pool.query(`
            SELECT c.*, 
                   s.nombre as servicio_nombre,
                   cl.nombre as cliente_nombre,
                   cl.email as cliente_email
            FROM cotizaciones c
            JOIN servicios s ON c.servicio_id = s.id
            JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.proveedor_id = ?
            ORDER BY c.fecha_creacion DESC
        `, [proveedorId]);

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cotizaciones del proveedor:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotizaciones' 
        });
    }
});

// OBTENER SOLICITUDES DISPONIBLES PARA COTIZAR
router.get('/solicitudes/disponibles', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT scs.*, 
                   s.nombre as servicio_solicitado,
                   c.nombre as cliente_nombre,
                   c.email as cliente_email
            FROM solicitudes_cliente_servicio scs
            JOIN servicios s ON scs.servicio_id = s.id
            JOIN clientes c ON scs.cliente_id = c.id
            WHERE scs.estado = 'pendiente'
            ORDER BY scs.fecha_solicitud DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error al obtener solicitudes disponibles:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener solicitudes' 
        });
    }
});

// REGISTRAR NUEVO SERVICIO
router.post('/servicios', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const { nombre, categoria_id, subcategoria_id, precio_base, descripcion } = req.body;

        const [result] = await pool.query(`
            INSERT INTO servicios 
            (proveedor_id, nombre, categoria_id, subcategoria_id, precio_base, descripcion, estado)
            VALUES (?, ?, ?, ?, ?, ?, 'activo')
        `, [req.user.id, nombre, categoria_id, subcategoria_id, precio_base, descripcion]);

        res.status(201).json({ 
            success: true, 
            message: 'Servicio registrado exitosamente',
            servicioId: result.insertId
        });
    } catch (error) {
        console.error('Error al registrar servicio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar servicio' 
        });
    }
});

// ENVIAR COTIZACIÓN A UNA SOLICITUD
router.post('/cotizaciones', authMiddleware.verifyToken, isProveedor, async (req, res) => {
    try {
        const { solicitud_id, precio, mensaje } = req.body;

        // Verificar que la solicitud existe y está pendiente
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

        // Insertar cotización
        const [result] = await pool.query(`
            INSERT INTO cotizaciones 
            (solicitud_id, proveedor_id, precio, mensaje, estado)
            VALUES (?, ?, ?, ?, 'pendiente')
        `, [solicitud_id, req.user.id, precio, mensaje]);

        res.status(201).json({ 
            success: true, 
            message: 'Cotización enviada exitosamente',
            cotizacionId: result.insertId
        });
    } catch (error) {
        console.error('Error al enviar cotización:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al enviar cotización' 
        });
    }
});