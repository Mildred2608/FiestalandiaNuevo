// server.js
const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
const startServer = async () => {
    // Probar conexión a BD antes de iniciar
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
        console.warn('  El servidor iniciará pero sin conexión a BD');
    }

    app.listen(PORT, () => {
        console.log(` Servidor corriendo en puerto ${PORT}`);
        console.log(` http://localhost:${PORT}`);
        console.log(` Modo: ${process.env.NODE_ENV || 'development'}`);
    });
};

// Iniciar servidor
startServer();