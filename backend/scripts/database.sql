-- Final clean schema for Fiestalandia
-- Execute in MySQL Workbench to recreate database from scratch

DROP DATABASE IF EXISTS fiestalandia;
CREATE DATABASE fiestalandia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fiestalandia;

-- drop tables if exist (safe for re-run)
DROP TABLE IF EXISTS auditoria,
         mensajes_proveedor,
         solicitudes_servicio,
         detalle_cotizacion,
         cotizaciones,
         eventos,
         servicios,
         proveedores,
         clientes,
         tipos_evento,
         subcategorias,
         categorias;

-- reference tables
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subcategorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE(categoria_id,nombre)
);

CREATE TABLE tipos_evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- main entities
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    direccion TEXT,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (CHAR_LENGTH(password_hash) >= 60),
    CHECK (email LIKE '%_@_%._%')
);

CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    direccion TEXT,
    aprobado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (email LIKE '%_@_%._%')
);

CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subcategoria_id INT NULL,
    proveedor_id INT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    nombre_evento VARCHAR(120),
    tipo_id INT,
    fecha DATE,
    invitados INT,
    ubicacion TEXT,
    mensaje TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (tipo_id) REFERENCES tipos_evento(id) ON DELETE SET NULL
);

CREATE TABLE cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('pendiente','enviada','aceptada','cancelada') NOT NULL DEFAULT 'pendiente',
    impuesto DECIMAL(10,2) DEFAULT 0,
    descuento DECIMAL(10,2) DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
);

CREATE TABLE detalle_cotizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    servicio_id INT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_unitario DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(12,2) AS (precio_unitario * cantidad) STORED,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL
);

CREATE TABLE solicitudes_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT,
    categoria_id INT,
    subcategoria_id INT,
    nombre_servicio VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_propuesto DECIMAL(10,2),
    estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id) ON DELETE SET NULL
);

CREATE TABLE mensajes_proveedor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    asunto VARCHAR(150),
    cuerpo TEXT,
    leido TINYINT(1) NOT NULL DEFAULT 0,
    enviado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
);

CREATE TABLE decoraciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    tema VARCHAR(50)
);

CREATE TABLE auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(100),
    fila_id INT,
    operacion ENUM('INSERT','UPDATE','DELETE'),
    usuario VARCHAR(150),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSON,
    datos_nuevos JSON
);

-- indexes
CREATE INDEX idx_evento_cliente ON eventos(cliente_id);
CREATE INDEX idx_cotizacion_evento ON cotizaciones(evento_id);
CREATE INDEX idx_detalle_cotizacion ON detalle_cotizacion(cotizacion_id);
CREATE INDEX idx_servicio_subcategoria ON servicios(subcategoria_id);
CREATE INDEX idx_proveedor_email ON proveedores(email);

-- views
CREATE OR REPLACE VIEW vista_servicios_publicos AS
SELECT s.id, c.nombre AS categoria, sc.nombre AS subcategoria, s.nombre,
       s.descripcion, s.precio_base
FROM servicios s
LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id
LEFT JOIN categorias c ON sc.categoria_id = c.id
WHERE s.activo = 1;

CREATE OR REPLACE VIEW vista_admin_eventos AS
SELECT e.id AS evento_id,
       e.nombre_evento,
       t.nombre AS tipo,
       e.fecha,
       e.invitados,
       e.ubicacion,
       e.mensaje,
       c.id AS cliente_id,
       c.nombre AS cliente_nombre,
       c.email AS cliente_email
FROM eventos e
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN tipos_evento t ON e.tipo_id = t.id;

-- user accounts creation (manual)
-- CREATE USER 'fiesta_admin'@'localhost' IDENTIFIED BY '12345678';
-- GRANT ALL PRIVILEGES ON fiestalandia.* TO 'fiesta_admin'@'localhost';
-- CREATE USER 'fiesta_cliente'@'localhost' IDENTIFIED BY 'temporal123';
-- GRANT SELECT ON fiestalandia.servicios TO 'fiesta_cliente'@'localhost';
-- GRANT SELECT ON fiestalandia.eventos TO 'fiesta_cliente'@'localhost';
-- GRANT SELECT ON fiestalandia.cotizaciones TO 'fiesta_cliente'@'localhost';
-- GRANT SELECT ON fiestalandia.detalle_cotizacion TO 'fiesta_cliente'@'localhost';
-- FLUSH PRIVILEGES;
