// src/models/Cliente.js
const db = require('../config/database').pool;

class cliente {
    // Buscar cliente por email
    static async findByEmail(email) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM clientes WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            console.error('Error en findByEmail:', error);
            throw error;
        }
    }

    // Buscar cliente por ID (sin password)
    static async findById(id) {
        try {
            const [rows] = await db.query(
                'SELECT id, nombre, email, telefono, direccion, rol FROM clientes WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error en findById:', error);
            throw error;
        }
    }
}

module.exports = cliente;