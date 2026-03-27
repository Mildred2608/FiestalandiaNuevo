// backend/src/routes/solicitudesRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

// ============================================
// CLIENTE: Enviar solicitud de registro de servicio
// ============================================
router.post('/solicitudes/nuevo-servicio', authMiddleware.verifyToken, async (req, res) => {
    try {
        const {
            cliente_id,
            categoria_id,
            subcategoria_id,
            nueva_subcategoria,
            nombre_servicio,
            descripcion,
            precio_propuesto,
            moneda,
            proveedor_nombre,
            proveedor_email,
            proveedor_telefono,
            proveedor_whatsapp,
            proveedor_direccion,
            sitio_web,
            imagenes,
            comentarios
        } = req.body;

        // Validar que el cliente autenticado sea el mismo que envía
        if (req.user.id !== cliente_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'No autorizado' 
            });
        }

        // Validar campos requeridos
        if (!nombre_servicio || !descripcion || !precio_propuesto || !proveedor_nombre || !proveedor_email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan campos requeridos' 
            });
        }

        const [result] = await pool.query(
            `INSERT INTO solicitudes_registro_servicio 
             (cliente_id, categoria_id, subcategoria_id, nueva_subcategoria,
              nombre_servicio, descripcion, precio_propuesto, moneda,
              proveedor_nombre, proveedor_email, proveedor_telefono,
              proveedor_whatsapp, proveedor_direccion, sitio_web,
              imagenes, comentarios, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
            [
                cliente_id,
                categoria_id || null,
                subcategoria_id || null,
                nueva_subcategoria || null,
                nombre_servicio,
                descripcion,
                precio_propuesto,
                moneda || 'MXN',
                proveedor_nombre,
                proveedor_email,
                proveedor_telefono || null,
                proveedor_whatsapp || null,
                proveedor_direccion || null,
                sitio_web || null,
                imagenes || null,
                comentarios || null
            ]
        );

        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            message: 'Solicitud enviada exitosamente' 
        });

    } catch (error) {
        console.error('Error al guardar solicitud:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al enviar solicitud' 
        });
    }
});

// ============================================
// ADMIN: Obtener todas las solicitudes
// ============================================
router.get('/admin/solicitudes-registro', authMiddleware.verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado' 
        });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_solicitudes_registro');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener solicitudes' 
        });
    }
});

// ============================================
// ADMIN: Aprobar solicitud (CREA PROVEEDOR Y SERVICIO AUTOMÁTICAMENTE)
// ============================================
router.post('/admin/solicitudes-registro/:id/aprobar', authMiddleware.verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado' 
        });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { observaciones } = req.body;

        // 1. Obtener la solicitud
        const [solicitud] = await connection.query(
            'SELECT * FROM solicitudes_registro_servicio WHERE id = ?',
            [id]
        );
        
        if (solicitud.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Solicitud no encontrada' 
            });
        }

        const sol = solicitud[0];

        // 2. VERIFICAR SI EL PROVEEDOR YA EXISTE (por email)
        let proveedorId = null;
        const [proveedorExistente] = await connection.query(
            'SELECT id FROM proveedores WHERE email = ?',
            [sol.proveedor_email]
        );

        if (proveedorExistente.length > 0) {
            // Si ya existe, usar ese proveedor
            proveedorId = proveedorExistente[0].id;
            
            // Actualizar datos si es necesario
            await connection.query(
                `UPDATE proveedores 
                 SET nombre = ?, telefono = ?, direccion = ?
                 WHERE id = ?`,
                [sol.proveedor_nombre, sol.proveedor_telefono, sol.proveedor_direccion, proveedorId]
            );
        } else {
            // Crear NUEVO proveedor
            const [nuevoProveedor] = await connection.query(
                `INSERT INTO proveedores 
                 (nombre, email, telefono, direccion, aprobado) 
                 VALUES (?, ?, ?, ?, 1)`,
                [
                    sol.proveedor_nombre,
                    sol.proveedor_email,
                    sol.proveedor_telefono,
                    sol.proveedor_direccion || null
                ]
            );
            proveedorId = nuevoProveedor.insertId;
        }

        // 3. DETERMINAR LA SUBCATEGORÍA
        let subcategoriaId = sol.subcategoria_id;
        
        // Si sugirió nueva subcategoría y no existe, crearla
        if (sol.nueva_subcategoria && !subcategoriaId) {
            const [nuevaSub] = await connection.query(
                `INSERT INTO subcategorias (categoria_id, nombre, descripcion) 
                 VALUES (?, ?, ?)`,
                [
                    sol.categoria_id,
                    sol.nueva_subcategoria,
                    'Creada automáticamente desde solicitud'
                ]
            );
            subcategoriaId = nuevaSub.insertId;
        }

        // 4. CREAR EL SERVICIO
        await connection.query(
            `INSERT INTO servicios 
             (subcategoria_id, proveedor_id, nombre, descripcion, precio_base, activo) 
             VALUES (?, ?, ?, ?, ?, 1)`,
            [
                subcategoriaId,
                proveedorId,
                sol.nombre_servicio,
                sol.descripcion,
                sol.precio_propuesto
            ]
        );

        // 5. ACTUALIZAR ESTADO DE LA SOLICITUD
        await connection.query(
            `UPDATE solicitudes_registro_servicio 
             SET estado = 'aprobada', atendido_por = ?, 
                 fecha_atencion = NOW(), observaciones_admin = ?
             WHERE id = ?`,
            [req.user.id, observaciones || 'Aprobada automáticamente', id]
        );

        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Solicitud aprobada. Proveedor y servicio creados exitosamente.',
            proveedor_id: proveedorId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al aprobar solicitud:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al aprobar solicitud: ' + error.message 
        });
    } finally {
        connection.release();
    }
});

// ============================================
// ADMIN: Rechazar solicitud
// ============================================
router.post('/admin/solicitudes-registro/:id/rechazar', authMiddleware.verifyToken, async (req, res) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado' 
        });
    }

    try {
        const { id } = req.params;
        const { observaciones } = req.body;

        await pool.query(
            `UPDATE solicitudes_registro_servicio 
             SET estado = 'rechazada', atendido_por = ?, 
                 fecha_atencion = NOW(), observaciones_admin = ?
             WHERE id = ?`,
            [req.user.id, observaciones || 'Rechazada', id]
        );

        res.json({ 
            success: true, 
            message: 'Solicitud rechazada' 
        });

    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al rechazar solicitud' 
        });
    }
});

// ============================================
// CLIENTE: OBTENER SUS SOLICITUDES DE REGISTRO
// ============================================
router.get('/cliente/mis-solicitudes', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, 
                   c.nombre as categoria_nombre,
                   sub.nombre as subcategoria_nombre
            FROM solicitudes_registro_servicio s
            LEFT JOIN categorias c ON s.categoria_id = c.id
            LEFT JOIN subcategorias sub ON s.subcategoria_id = sub.id
            WHERE s.cliente_id = ?
            ORDER BY s.fecha_solicitud DESC
        `, [req.user.id]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener solicitudes' 
        });
    }
});
module.exports = router;