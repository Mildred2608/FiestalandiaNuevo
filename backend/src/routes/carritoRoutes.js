// backend/src/routes/carritoRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

// ============================================
// OBTENER CARRITO DEL USUARIO
// ============================================
router.get('/', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.id, c.cantidad, c.evento_id, c.evento_nombre, c.fecha_agregado,
                   s.id as servicio_id, s.nombre, s.descripcion, s.precio_base as precio,
                   sc.nombre as subcategoria,
                   p.nombre as proveedor
            FROM carrito c
            JOIN servicios s ON c.servicio_id = s.id
            LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id
            LEFT JOIN proveedores p ON s.proveedor_id = p.id
            WHERE c.cliente_id = ?
            ORDER BY c.fecha_agregado DESC
        `, [req.user.id]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener carrito' 
        });
    }
});

// ============================================
// AGREGAR AL CARRITO
// ============================================
router.post('/agregar', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { servicio_id, cantidad, evento_id, evento_nombre } = req.body;
        const usuario_id = req.user.id;
        
        const [servicio] = await pool.query(
            'SELECT id FROM servicios WHERE id = ? AND activo = 1',
            [servicio_id]
        );
        
        if (servicio.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Servicio no encontrado' 
            });
        }
        
        const [existente] = await pool.query(
            `SELECT id, cantidad FROM carrito 
             WHERE cliente_id = ? AND servicio_id = ? 
             AND (evento_id = ? OR (evento_id IS NULL AND ? IS NULL))`,
            [usuario_id, servicio_id, evento_id || null, evento_id || null]
        );
        
        if (existente.length > 0) {
            await pool.query(
                'UPDATE carrito SET cantidad = cantidad + ? WHERE id = ?',
                [cantidad || 1, existente[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO carrito (cliente_id, servicio_id, cantidad, evento_id, evento_nombre) 
                 VALUES (?, ?, ?, ?, ?)`,
                [usuario_id, servicio_id, cantidad || 1, evento_id || null, evento_nombre || null]
            );
        }
        
        res.json({ 
            success: true, 
            message: 'Servicio agregado al carrito' 
        });
        
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al agregar al carrito' 
        });
    }
});

// ============================================
// ACTUALIZAR CANTIDAD
// ============================================
router.put('/actualizar/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { cantidad } = req.body;
        const carrito_id = req.params.id;
        
        if (cantidad < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'La cantidad debe ser mayor a 0' 
            });
        }
        
        const [result] = await pool.query(
            'UPDATE carrito SET cantidad = ? WHERE id = ? AND cliente_id = ?',
            [cantidad, carrito_id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item no encontrado en el carrito' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Cantidad actualizada' 
        });
        
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar cantidad' 
        });
    }
});

// ============================================
// ELIMINAR ITEM DEL CARRITO
// ============================================
router.delete('/eliminar/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM carrito WHERE id = ? AND cliente_id = ?',
            [req.params.id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item no encontrado en el carrito' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Servicio eliminado del carrito' 
        });
        
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar del carrito' 
        });
    }
});

// ============================================
// VACIAR CARRITO (todo o por evento)
// ============================================
router.delete('/vaciar', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { evento_id } = req.query;
        
        if (evento_id) {
            await pool.query(
                'DELETE FROM carrito WHERE cliente_id = ? AND evento_id = ?',
                [req.user.id, evento_id]
            );
            res.json({ 
                success: true, 
                message: `Carrito del evento vaciado` 
            });
        } else {
            await pool.query(
                'DELETE FROM carrito WHERE cliente_id = ?',
                [req.user.id]
            );
            res.json({ 
                success: true, 
                message: 'Carrito vaciado completamente' 
            });
        }
        
    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al vaciar carrito' 
        });
    }
});

// ============================================
// OBTENER TOTAL EN DINERO
// ============================================
router.get('/total', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT SUM(s.precio_base * c.cantidad) as total
            FROM carrito c
            JOIN servicios s ON c.servicio_id = s.id
            WHERE c.cliente_id = ?
        `, [req.user.id]);
        
        res.json({ total: rows[0].total || 0 });
        
    } catch (error) {
        console.error('Error al obtener total:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener total' 
        });
    }
});

// ============================================
// OBTENER CANTIDAD DE ARTÍCULOS (para el badge)
// ============================================
router.get('/cantidad', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT SUM(cantidad) as total
            FROM carrito
            WHERE cliente_id = ?
        `, [req.user.id]);
        
        res.json({ total: rows[0].total || 0 });
        
    } catch (error) {
        console.error('Error al obtener cantidad:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cantidad' 
        });
    }
});

// ============================================
// CONVERTIR CARRITO EN COTIZACIÓN
// ============================================
router.post('/cotizar', authMiddleware.verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const usuario_id = req.user.id;
        
        const [items] = await connection.query(`
            SELECT c.servicio_id, c.cantidad, c.evento_id, 
                   s.nombre, s.descripcion, s.precio_base
            FROM carrito c
            JOIN servicios s ON c.servicio_id = s.id
            WHERE c.cliente_id = ?
        `, [usuario_id]);
        
        if (items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'El carrito está vacío' 
            });
        }
        
        let total = 0;
        items.forEach(item => {
            total += item.precio_base * item.cantidad;
        });
        
        let evento_id = items[0]?.evento_id;
        
        if (!evento_id) {
            const [evento] = await connection.query(
                `INSERT INTO eventos (cliente_id, nombre_evento, fecha) 
                 VALUES (?, ?, CURDATE())`,
                [usuario_id, 'Evento sin nombre']
            );
            evento_id = evento.insertId;
        }
        
        const [cotizacion] = await connection.query(
            `INSERT INTO cotizaciones (evento_id, total, estado) 
             VALUES (?, ?, 'pendiente')`,
            [evento_id, total]
        );
        
        for (const item of items) {
            await connection.query(
                `INSERT INTO detalle_cotizacion 
                 (cotizacion_id, servicio_id, nombre, descripcion, precio_unitario, cantidad) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    cotizacion.insertId,
                    item.servicio_id,
                    item.nombre,
                    item.descripcion,
                    item.precio_base,
                    item.cantidad
                ]
            );
        }
        
        await connection.query(
            'DELETE FROM carrito WHERE cliente_id = ?',
            [usuario_id]
        );
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            cotizacion_id: cotizacion.insertId,
            total: total,
            message: 'Cotización generada exitosamente' 
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error al generar cotización:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al generar cotización' 
        });
    } finally {
        connection.release();
    }
});

// ============================================
// CLIENTE: OBTENER TODAS SUS COTIZACIONES
// ============================================
router.get('/admin/cliente/cotizaciones', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, e.nombre_evento 
            FROM cotizaciones c
            JOIN eventos e ON c.evento_id = e.id
            WHERE e.cliente_id = ?
            ORDER BY c.id DESC
        `, [req.user.id]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotizaciones' 
        });
    }
});

// ============================================
// CLIENTE: OBTENER DETALLE DE COTIZACIÓN
// ============================================
router.get('/admin/cliente/cotizaciones/:id', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [cotizacion] = await pool.query(`
            SELECT c.*, e.nombre_evento FROM cotizaciones c
            JOIN eventos e ON c.evento_id = e.id
            WHERE c.id = ? AND e.cliente_id = ?
        `, [id, req.user.id]);
        
        if (cotizacion.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cotización no encontrada' 
            });
        }
        
        const [detalles] = await pool.query(`
            SELECT d.* FROM detalle_cotizacion d
            WHERE d.cotizacion_id = ?
        `, [id]);
        
        res.json({
            ...cotizacion[0],
            detalles
        });
        
    } catch (error) {
        console.error('Error al obtener cotización:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotización' 
        });
    }
});

// ============================================
// CLIENTE: ACEPTAR COTIZACIÓN
// ============================================
router.post('/cotizaciones/:id/aceptar', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [cotizacion] = await pool.query(`
            SELECT c.* FROM cotizaciones c
            JOIN eventos e ON c.evento_id = e.id
            WHERE c.id = ? AND e.cliente_id = ?
        `, [id, req.user.id]);
        
        if (cotizacion.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cotización no encontrada' 
            });
        }
        
        if (cotizacion[0].estado !== 'enviada') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se pueden aceptar cotizaciones en estado enviada' 
            });
        }
        
        await pool.query(
            'UPDATE cotizaciones SET estado = "aceptada" WHERE id = ?',
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Cotización aceptada exitosamente' 
        });
        
    } catch (error) {
        console.error('Error al aceptar cotización:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al aceptar cotización' 
        });
    }
});

// ============================================
// CLIENTE: RECHAZAR COTIZACIÓN
// ============================================
router.post('/cotizaciones/:id/rechazar', authMiddleware.verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [cotizacion] = await pool.query(`
            SELECT c.* FROM cotizaciones c
            JOIN eventos e ON c.evento_id = e.id
            WHERE c.id = ? AND e.cliente_id = ?
        `, [id, req.user.id]);
        
        if (cotizacion.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cotización no encontrada' 
            });
        }
        
        if (cotizacion[0].estado !== 'enviada') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se pueden rechazar cotizaciones en estado enviada' 
            });
        }
        
        await pool.query(
            'UPDATE cotizaciones SET estado = "rechazada" WHERE id = ?',
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Cotización rechazada' 
        });
        
    } catch (error) {
        console.error('Error al rechazar cotización:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al rechazar cotización' 
        });
    }
});

// ============================================
// ADMIN: OBTENER TODAS LAS COTIZACIONES
// ============================================
router.get('/admin/cotizaciones', authMiddleware.verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado' 
        });
    }
    
    try {
        const [rows] = await pool.query(`
            SELECT c.*, e.nombre_evento, cl.nombre as cliente_nombre, cl.email as cliente_email
            FROM cotizaciones c
            JOIN eventos e ON c.evento_id = e.id
            JOIN clientes cl ON e.cliente_id = cl.id
            ORDER BY c.id DESC
        `);
        
        res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotizaciones' 
        });
    }
});

// ============================================
// ADMIN: CAMBIAR ESTADO DE COTIZACIÓN
// ============================================
router.put('/admin/cotizaciones/:id/estado', authMiddleware.verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado' 
        });
    }
    
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        const estadosValidos = ['pendiente', 'enviada', 'aceptada', 'rechazada', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Estado no válido' 
            });
        }
        
        await pool.query(
            'UPDATE cotizaciones SET estado = ? WHERE id = ?',
            [estado, id]
        );
        
        if (estado === 'enviada') {
            const [proveedores] = await pool.query(`
                SELECT DISTINCT p.email, p.nombre 
                FROM detalle_cotizacion dc
                JOIN servicios s ON dc.servicio_id = s.id
                JOIN proveedores p ON s.proveedor_id = p.id
                WHERE dc.cotizacion_id = ?
            `, [id]);
            
            console.log('📧 Notificar a proveedores:', proveedores);
        }
        
        res.json({ 
            success: true, 
            message: `Estado actualizado a "${estado}"`,
            notificaciones: estado === 'enviada' ? proveedores?.length || 0 : 0
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar estado' 
        });
    }
});

module.exports = router;