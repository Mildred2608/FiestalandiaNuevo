-- CATEGORÍAS (Lugar, Música, Banquetes, Decoración)
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_url VARCHAR(255) NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SUBCATEGORÍAS (Salones, Jardines, DJ, Mariachi, etc.)
CREATE TABLE subcategorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255) NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE(categoria_id, nombre)
);

-- TIPOS DE EVENTO (Boda, XV Años, Cumpleaños, etc.)
CREATE TABLE tipos_evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- CLIENTES (usuarios del sistema)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    direccion TEXT,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROVEEDORES (empresas que ofrecen servicios)
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(30),
    direccion TEXT,
    aprobado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SERVICIOS (productos ofrecidos)
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

-- EVENTOS (eventos creados por clientes)
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

-- COTIZACIONES
CREATE TABLE cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('pendiente', 'enviada', 'aceptada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    impuesto DECIMAL(10,2) DEFAULT 0,
    descuento DECIMAL(10,2) DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
);

-- DETALLE DE COTIZACIONES
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

-- SOLICITUDES DE REGISTRO DE SERVICIOS (clientes solicitan registrar nuevos servicios)
CREATE TABLE solicitudes_registro_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    categoria_id INT,
    subcategoria_id INT,
    nueva_subcategoria VARCHAR(100),
    nombre_servicio VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_propuesto DECIMAL(10,2),
    moneda VARCHAR(3) DEFAULT 'MXN',
    proveedor_nombre VARCHAR(100) NOT NULL,
    proveedor_email VARCHAR(150) NOT NULL,
    proveedor_telefono VARCHAR(30),
    proveedor_whatsapp VARCHAR(30),
    proveedor_direccion TEXT,
    sitio_web VARCHAR(255),
    imagenes TEXT,
    comentarios TEXT,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_atencion TIMESTAMP NULL,
    atendido_por INT,
    observaciones_admin TEXT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id) ON DELETE SET NULL,
    FOREIGN KEY (atendido_por) REFERENCES clientes(id) ON DELETE SET NULL
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_evento_cliente ON eventos(cliente_id);
CREATE INDEX idx_cotizacion_evento ON cotizaciones(evento_id);
CREATE INDEX idx_detalle_cotizacion ON detalle_cotizacion(cotizacion_id);
CREATE INDEX idx_servicio_subcategoria ON servicios(subcategoria_id);
CREATE INDEX idx_proveedor_email ON proveedores(email);
CREATE INDEX idx_solicitudes_cliente ON solicitudes_registro_servicio(cliente_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_registro_servicio(estado);

-- ============================================
-- VISTAS
-- ============================================

-- Servicios públicos (para todos)
CREATE OR REPLACE VIEW vista_servicios_publicos AS
SELECT 
    s.id, s.nombre, s.descripcion, s.precio_base,
    sc.nombre AS subcategoria, sc.id AS subcategoria_id,
    c.nombre AS categoria, c.id AS categoria_id,
    p.nombre AS proveedor, p.id AS proveedor_id
FROM servicios s
LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id
LEFT JOIN categorias c ON sc.categoria_id = c.id
LEFT JOIN proveedores p ON s.proveedor_id = p.id
WHERE s.activo = 1
ORDER BY c.nombre, sc.nombre, s.nombre;

-- Admin: Todos los servicios
CREATE OR REPLACE VIEW vista_admin_servicios AS
SELECT 
    s.id, s.nombre, s.descripcion, s.precio_base, s.activo, s.creado_en,
    sc.nombre AS subcategoria, sc.id AS subcategoria_id,
    c.nombre AS categoria, c.id AS categoria_id,
    p.nombre AS proveedor, p.id AS proveedor_id, p.email AS proveedor_email
FROM servicios s
LEFT JOIN subcategorias sc ON s.subcategoria_id = sc.id
LEFT JOIN categorias c ON sc.categoria_id = c.id
LEFT JOIN proveedores p ON s.proveedor_id = p.id
ORDER BY s.id DESC;

-- Admin: Proveedores
CREATE OR REPLACE VIEW vista_admin_proveedores AS
SELECT id, nombre, email, telefono, direccion, aprobado, creado_en
FROM proveedores ORDER BY id DESC;

-- Admin: Clientes
CREATE OR REPLACE VIEW vista_admin_clientes AS
SELECT id, nombre, email, telefono, rol, creado_en
FROM clientes ORDER BY id DESC;

-- Admin: Cotizaciones
CREATE OR REPLACE VIEW vista_admin_cotizaciones AS
SELECT 
    c.id, c.evento_id, c.total, c.estado, c.creado_en,
    cl.nombre AS cliente, cl.email AS cliente_email, cl.id AS cliente_id,
    e.nombre_evento
FROM cotizaciones c
LEFT JOIN eventos e ON c.evento_id = e.id
LEFT JOIN clientes cl ON e.cliente_id = cl.id
ORDER BY c.id DESC;

-- Admin: Eventos
CREATE OR REPLACE VIEW vista_admin_eventos AS
SELECT 
    e.id AS evento_id, e.nombre_evento, t.nombre AS tipo,
    e.fecha, e.invitados, e.ubicacion, e.mensaje,
    c.id AS cliente_id, c.nombre AS cliente_nombre, c.email AS cliente_email
FROM eventos e
LEFT JOIN clientes c ON e.cliente_id = c.id
LEFT JOIN tipos_evento t ON e.tipo_id = t.id
ORDER BY e.id DESC;

-- Admin: Solicitudes de registro
CREATE OR REPLACE VIEW vista_admin_solicitudes_registro AS
SELECT 
    s.*,
    c.nombre AS cliente_nombre, c.email AS cliente_email, c.telefono AS cliente_telefono,
    cat.nombre AS categoria_nombre,
    sub.nombre AS subcategoria_nombre,
    a.nombre AS atendido_por_nombre
FROM solicitudes_registro_servicio s
LEFT JOIN clientes c ON s.cliente_id = c.id
LEFT JOIN categorias cat ON s.categoria_id = cat.id
LEFT JOIN subcategorias sub ON s.subcategoria_id = sub.id
LEFT JOIN clientes a ON s.atendido_por = a.id
ORDER BY 
    CASE s.estado 
        WHEN 'pendiente' THEN 1
        WHEN 'aprobada' THEN 2
        WHEN 'rechazada' THEN 3
    END,
    s.fecha_solicitud DESC;

-- Cliente: Sus cotizaciones
CREATE OR REPLACE VIEW vista_cliente_cotizaciones AS
SELECT 
    c.id, c.evento_id, c.total, c.estado, c.creado_en,
    e.nombre_evento, e.cliente_id
FROM cotizaciones c
JOIN eventos e ON c.evento_id = e.id;

-- Cliente: Sus eventos
CREATE OR REPLACE VIEW vista_cliente_eventos AS
SELECT id, nombre_evento, fecha, invitados, ubicacion, creado_en, cliente_id
FROM eventos;