//backend/src/routes/provedorRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

//VERFIFICAR QUE EL USUARIO SEA PROVEEDOR O ADMIN
const isProveedor = (req, res, next) => {
    if (req.user.rol !== 'proveedor' && req.user.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Solo proveedores o administradores.' 

        });
    }
    next();
};

//OBTENER LOS SERVICOS DEL PROVEEDOR
router.get('mis-servicos', authMiddleware.verifyToken, isProveedor, async (req, res) => {

    try {
        const [proveedor] = await pool.query('SELECT * FROM proveedores WHERE id = ?', [req.user.id]);
        if (proveedor.length === 0) {
            return res.json([]);
        };

        const [rows] = await pool.query(
        `SELECT s.*, sc.nombre as subcategoria, c.nombre as categoria FROM servicios s LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id LEFT JOIN categorias c ON sc.categoria_id = sc.id WHERE s.proveedor_id = ? ORDER BY s.id DESC `, [proveedor[0].id]);

            res.json(rows);
        } catch (error) {
            console.error('Error al obtner el servicio del proveedor:', error);
            res.status(500).json({
                success: false, message: 'Error al obtener servicos'
      });
    }      
});


//Obtner solicitudes de clientes paea servicios del proveedor
router.get('/solicitudes', authMiddleware.veryfyToken, isProveedor, async (req, res) => {
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