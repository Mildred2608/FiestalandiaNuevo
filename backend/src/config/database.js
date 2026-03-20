// src/config/database.js
const mysql = require('mysql2');

// Crear el pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'fiestalandia',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir a promesas para usar async/await
const promisePool = pool.promise();

// Función para probar la conexión
const testConnection = async () => {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS result');
        console.log(' Conexión a MySQL exitosa');
        console.log(' Base de datos:', process.env.DB_NAME || 'fiestalandia');
        return true;
    } catch (error) {
        console.error(' Error conectando a MySQL:');
        console.error('   Mensaje:', error.message);
        console.error('   Código:', error.code);
        return false;
    }
};

// Exportar el pool y la función de prueba
module.exports = {
    pool: promisePool,
    testConnection
};