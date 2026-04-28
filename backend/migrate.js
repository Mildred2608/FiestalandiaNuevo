const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    console.log('Iniciando migraciones...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '12345678',
            database: process.env.DB_NAME || 'fiestalandia',
            port: Number(process.env.DB_PORT) || 3306
        });

        console.log('Conexión establecida.');

        // 1. Agregar imagen_url a categorias
        try {
            await connection.query('ALTER TABLE categorias ADD COLUMN imagen_url VARCHAR(255) NULL');
            console.log('Columna imagen_url agregada a categorias.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Columna imagen_url ya existe en categorias.');
            } else {
                console.error('Error alterando categorias:', e.message);
            }
        }

        // 2. Agregar imagen_url a subcategorias
        try {
            await connection.query('ALTER TABLE subcategorias ADD COLUMN imagen_url VARCHAR(255) NULL');
            console.log('Columna imagen_url agregada a subcategorias.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Columna imagen_url ya existe en subcategorias.');
            } else {
                console.error('Error alterando subcategorias:', e.message);
            }
        }

        // 3. Agregar imagen_url a servicios
        try {
            await connection.query('ALTER TABLE servicios ADD COLUMN imagen_url VARCHAR(255) NULL');
            console.log('Columna imagen_url agregada a servicios.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Columna imagen_url ya existe en servicios.');
            } else {
                console.error('Error alterando servicios:', e.message);
            }
        }

        // 4. Crear tabla carrito
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS carrito (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    cliente_id INT NOT NULL,
                    servicio_id INT NOT NULL,
                    cantidad INT DEFAULT 1,
                    evento_id INT NULL,
                    evento_nombre VARCHAR(255) NULL,
                    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
                    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
                    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
                )
            `);
            console.log('Tabla carrito verificada/creada.');
        } catch (e) {
            console.error('Error creando tabla carrito:', e.message);
        }

        // Actualizar las vistas si es necesario, o recrearlas si dependían de columnas específicas (aunque normalmente un SELECT * se actualiza, es mejor recrearlas)
        try {
            await connection.query('DROP VIEW IF EXISTS vista_servicios_publicos');
            await connection.query(`
                CREATE VIEW vista_servicios_publicos AS
                SELECT 
                    s.id, 
                    s.nombre, 
                    s.descripcion, 
                    s.precio_base, 
                    s.imagen_url,
                    s.subcategoria_id, 
                    sc.nombre as subcategoria_nombre,
                    c.id as categoria_id, 
                    c.nombre as categoria_nombre,
                    p.id as proveedor_id,
                    p.nombre as proveedor_nombre
                FROM servicios s
                LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id
                LEFT JOIN categorias c ON sc.categoria_id = c.id
                LEFT JOIN proveedores p ON s.proveedor_id = p.id
                WHERE s.activo = 1
            `);
            console.log('Vista vista_servicios_publicos recreada con imagen_url.');
        } catch(e) {
             console.error('Error recreando vista:', e.message);
        }

        console.log('Migraciones completadas.');
    } catch (error) {
        console.error('Error general de migración:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrate();
