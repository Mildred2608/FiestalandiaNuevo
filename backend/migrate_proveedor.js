const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fiestalandia'
  });

  // Crear tabla para solicitudes de cotización
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS solicitudes_cotizacion (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL,
      servicio_solicitado VARCHAR(255) NOT NULL,
      detalles TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado ENUM('pendiente', 'cotizada', 'cancelada') DEFAULT 'pendiente',
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    )
  `);

  // Actualizar tabla cotizaciones para proveedores
  await connection.execute(`
    ALTER TABLE cotizaciones
    ADD COLUMN IF NOT EXISTS solicitud_id INT NULL,
    ADD COLUMN IF NOT EXISTS proveedor_id INT NULL,
    ADD COLUMN IF NOT EXISTS servicio_id INT NULL,
    ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) NULL,
    ADD COLUMN IF NOT EXISTS mensaje TEXT NULL
  `);

  console.log('Tablas actualizadas');
  await connection.end();
}

createTables().catch(console.error);