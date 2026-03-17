// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware para verificar que es admin
const isAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador' 
        });
    }
    next();
};

// ============================================
// RUTAS QUE USAN VISTAS DE ADMIN
// ============================================

// Obtener todos los servicios (usando vista_admin_servicios)
router.get('/servicios', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_servicios');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener servicios' 
        });
    }
});

// Obtener todos los proveedores (usando vista_admin_proveedores)
router.get('/proveedores', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_proveedores');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener proveedores' 
        });
    }
});

// Obtener todos los clientes (usando vista_admin_clientes)
router.get('/clientes', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_clientes');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener clientes' 
        });
    }
});

// Obtener todas las cotizaciones (usando vista_admin_cotizaciones)
router.get('/cotizaciones', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_cotizaciones');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotizaciones' 
        });
    }
});

// Obtener todos los eventos (usando vista_admin_eventos)
router.get('/eventos', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_eventos');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener eventos' 
        });
    }
});

// ============================================
// RUTAS PARA CLIENTES (con filtro por usuario)
// ============================================

// Obtener cotizaciones del cliente actual
router.get('/cliente/cotizaciones', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM vista_cliente_cotizaciones WHERE cliente_id = ?',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotizaciones' 
        });
    }
});

// Obtener eventos del cliente actual
router.get('/cliente/eventos', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM vista_cliente_eventos WHERE cliente_id = ?',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener eventos' 
        });
    }
});

// ============================================
// CATEGORÍAS (CRUD)
// ============================================

// Obtener todas las categorías
router.get('/categorias', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, imagen_url, creado_en 
            FROM categorias 
            ORDER BY id DESC
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

// Crear nueva categoría
router.post('/categorias', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, imagen_url } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ 
                success: false, 
                message: 'El nombre de la categoría es requerido' 
            });
        }
        
        const [result] = await pool.query(
            'INSERT INTO categorias (nombre, descripcion, imagen_url) VALUES (?, ?, ?)',
            [nombre, descripcion || null, imagen_url || null]
        );
        
        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            message: 'Categoría creada exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear categoría' 
        });
    }
});

// ============================================
// SUBCATEGORÍAS
// ============================================

// Obtener todas las subcategorías
router.get('/subcategorias', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.id, s.nombre, s.descripcion, s.imagen_url, s.creado_en,
                   s.categoria_id, c.nombre as categoria_nombre
            FROM subcategorias s
            LEFT JOIN categorias c ON s.categoria_id = c.id
            ORDER BY s.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener subcategorías:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener subcategorías' 
        });
    }
});

// Obtener subcategorías por categoría (para selects)
router.get('/subcategorias/:categoriaId', authMiddleware.verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, nombre FROM subcategorias WHERE categoria_id = ? ORDER BY nombre',
            [req.params.categoriaId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener subcategorías:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener subcategorías' 
        });
    }
});

// Crear nueva subcategoría
router.post('/subcategorias', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { categoria_id, nombre, descripcion, imagen_url } = req.body;
        
        if (!categoria_id || !nombre) {
            return res.status(400).json({ 
                success: false, 
                message: 'La categoría y el nombre son requeridos' 
            });
        }
        
        const [result] = await pool.query(
            'INSERT INTO subcategorias (categoria_id, nombre, descripcion, imagen_url) VALUES (?, ?, ?, ?)',
            [categoria_id, nombre, descripcion || null, imagen_url || null]
        );
        
        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            message: 'Subcategoría creada exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear subcategoría:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear subcategoría' 
        });
    }
});

// ============================================
// PROVEEDORES (para selects)
// ============================================

// Obtener proveedores aprobados
router.get('/proveedores-list', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, email, telefono 
            FROM proveedores 
            WHERE aprobado = 1 
            ORDER BY nombre
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener proveedores' 
        });
    }
});

// ============================================
// SERVICIOS (CRUD)
// ============================================

// Crear nuevo servicio
router.post('/servicios', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { subcategoria_id, proveedor_id, nombre, descripcion, precio_base } = req.body;
        
        if (!subcategoria_id || !proveedor_id || !nombre || !precio_base) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            });
        }
        
        if (precio_base <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El precio debe ser mayor a 0' 
            });
        }
        
        const [result] = await pool.query(
            `INSERT INTO servicios 
             (subcategoria_id, proveedor_id, nombre, descripcion, precio_base, activo) 
             VALUES (?, ?, ?, ?, ?, 1)`,
            [subcategoria_id, proveedor_id, nombre, descripcion || null, precio_base]
        );
        
        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            message: 'Servicio creado exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear servicio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear servicio' 
        });
    }
});

// Obtener un servicio específico para editar
router.get('/servicios/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, 
                   sc.nombre as subcategoria_nombre,
                   sc.id as subcategoria_id,
                   c.nombre as categoria_nombre,
                   p.nombre as proveedor_nombre,
                   p.id as proveedor_id
            FROM servicios s
            LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id
            LEFT JOIN categorias c ON sc.categoria_id = c.id
            LEFT JOIN proveedores p ON s.proveedor_id = p.id
            WHERE s.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Servicio no encontrado' 
            });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener servicio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener servicio' 
        });
    }
});

// Actualizar un servicio
router.put('/servicios/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { subcategoria_id, proveedor_id, nombre, descripcion, precio_base, activo } = req.body;
        
        if (!subcategoria_id || !proveedor_id || !nombre || !precio_base) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            });
        }
        
        const [result] = await pool.query(
            `UPDATE servicios 
             SET subcategoria_id = ?, proveedor_id = ?, nombre = ?, 
                 descripcion = ?, precio_base = ?, activo = ?
             WHERE id = ?`,
            [subcategoria_id, proveedor_id, nombre, descripcion || null, precio_base, activo || 1, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Servicio no encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Servicio actualizado exitosamente' 
        });
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar servicio' 
        });
    }
});

// Desactivar un servicio
router.delete('/servicios/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query(
            'UPDATE servicios SET activo = 0 WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Servicio no encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Servicio desactivado exitosamente' 
        });
    } catch (error) {
        console.error('Error al desactivar servicio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al desactivar servicio' 
        });
    }
});

// Reactivar un servicio
router.post('/servicios/:id/reactivar', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query(
            'UPDATE servicios SET activo = 1 WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Servicio no encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Servicio reactivado exitosamente' 
        });
    } catch (error) {
        console.error('Error al reactivar servicio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al reactivar servicio' 
        });
    }
});

// ============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ============================================

// Obtener todas las categorías (público)
router.get('/categorias/publicas', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, imagen_url 
            FROM categorias 
            ORDER BY nombre
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener servicios públicos
router.get('/servicios/publicos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_servicios_publicos');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener servicios públicos:', error);
        res.status(500).json({ message: error.message });
    }
});

// Obtener servicios por categoría (para botón "Agregar")
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
        res.status(500).json({ message: error.message });
    }
});

// ============================================
// PROVEEDORES - CRUD COMPLETO
// ============================================

// Obtener todos los proveedores (usando vista)
router.get('/proveedores', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_proveedores');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener proveedores' 
        });
    }
});

// Crear nuevo proveedor
router.post('/proveedores', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { nombre, email, telefono, direccion } = req.body;
        
        if (!nombre || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre y email son requeridos' 
            });
        }
        
        const [result] = await pool.query(
            `INSERT INTO proveedores (nombre, email, telefono, direccion, aprobado) 
             VALUES (?, ?, ?, ?, 0)`,
            [nombre, email, telefono || null, direccion || null]
        );
        
        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            message: 'Proveedor creado exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear proveedor' 
        });
    }
});

// Obtener un proveedor por ID
router.get('/proveedores/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM proveedores WHERE id = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Proveedor no encontrado' 
            });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener proveedor' 
        });
    }
});

// Actualizar proveedor
router.put('/proveedores/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, direccion } = req.body;
        
        const [result] = await pool.query(
            `UPDATE proveedores 
             SET nombre = ?, email = ?, telefono = ?, direccion = ?
             WHERE id = ?`,
            [nombre, email, telefono, direccion, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Proveedor no encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Proveedor actualizado exitosamente' 
        });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar proveedor' 
        });
    }
});

// Aprobar/Desactivar proveedor
router.post('/proveedores/:id/toggle', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener estado actual
        const [proveedor] = await pool.query(
            'SELECT aprobado FROM proveedores WHERE id = ?',
            [id]
        );
        
        if (proveedor.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Proveedor no encontrado' 
            });
        }
        
        const nuevoEstado = proveedor[0].aprobado ? 0 : 1;
        
        await pool.query(
            'UPDATE proveedores SET aprobado = ? WHERE id = ?',
            [nuevoEstado, id]
        );
        
        res.json({ 
            success: true, 
            message: `Proveedor ${nuevoEstado ? 'aprobado' : 'desactivado'} exitosamente` 
        });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al cambiar estado' 
        });
    }
});

// ============================================
// COTIZACIONES - CRUD
// ============================================

// Obtener todas las cotizaciones (usando vista)
router.get('/cotizaciones', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_cotizaciones');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener cotizaciones' 
        });
    }
});

// Actualizar estado de cotización
router.put('/cotizaciones/:id/estado', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        const estadosValidos = ['pendiente', 'enviada', 'aceptada', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Estado no válido' 
            });
        }
        
        const [result] = await pool.query(
            'UPDATE cotizaciones SET estado = ? WHERE id = ?',
            [estado, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cotización no encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Estado actualizado exitosamente' 
        });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar estado' 
        });
    }
});

// Obtener detalles de una cotización
router.get('/cotizaciones/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, e.nombre_evento, e.fecha, e.invitados,
                   cl.nombre as cliente_nombre, cl.email as cliente_email
            FROM cotizaciones c
            JOIN eventos e ON c.evento_id = e.id
            JOIN clientes cl ON e.cliente_id = cl.id
            WHERE c.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cotización no encontrada' 
            });
        }
        
        // Obtener detalles de la cotización
        const [detalles] = await pool.query(`
            SELECT d.*, s.nombre as servicio_nombre
            FROM detalle_cotizacion d
            LEFT JOIN servicios s ON d.servicio_id = s.id
            WHERE d.cotizacion_id = ?
        `, [req.params.id]);
        
        res.json({
            ...rows[0],
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
// EVENTOS - CRUD
// ============================================

// Obtener todos los eventos (usando vista)
router.get('/eventos', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM vista_admin_eventos');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener eventos' 
        });
    }
});

// Obtener un evento específico
router.get('/eventos/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT e.*, t.nombre as tipo_nombre,
                   c.nombre as cliente_nombre, c.email as cliente_email
            FROM eventos e
            LEFT JOIN tipos_evento t ON e.tipo_id = t.id
            LEFT JOIN clientes c ON e.cliente_id = c.id
            WHERE e.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Evento no encontrado' 
            });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener evento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener evento' 
        });
    }
});

// Actualizar evento
router.put('/eventos/:id', authMiddleware.verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_evento, fecha, invitados, ubicacion, tipo_id } = req.body;
        
        const [result] = await pool.query(
            `UPDATE eventos 
             SET nombre_evento = ?, fecha = ?, invitados = ?, ubicacion = ?, tipo_id = ?
             WHERE id = ?`,
            [nombre_evento, fecha, invitados, ubicacion, tipo_id, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Evento no encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Evento actualizado exitosamente' 
        });
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar evento' 
        });
    }
});


module.exports = router;