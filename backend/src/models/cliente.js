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

    // Obtener roles del cliente como array
    static parseRoles(rolString) {
        if (!rolString) return ['cliente'];
        if (Array.isArray(rolString)) return rolString;
        return rolString.split(',').map(r => r.trim()).filter(r => r);
    }

    // Agregar rol a un cliente
    static async addRole(clienteId, newRole) {
        try {
            const [rows] = await db.query(
                'SELECT rol FROM clientes WHERE id = ?',
                [clienteId]
            );
            
            if (rows.length === 0) throw new Error('Cliente no encontrado');
            
            const rolesArray = this.parseRoles(rows[0].rol);
            
            // Si el rol ya existe, no hacer nada
            if (!rolesArray.includes(newRole)) {
                rolesArray.push(newRole);
                const rolesString = rolesArray.join(',');
                
                await db.query(
                    'UPDATE clientes SET rol = ? WHERE id = ?',
                    [rolesString, clienteId]
                );
            }
            
            return rolesArray;
        } catch (error) {
            console.error('Error en addRole:', error);
            throw error;
        }
    }

    // Verificar si un cliente tiene un rol específico
    static async hasRole(clienteId, role) {
        try {
            const [rows] = await db.query(
                'SELECT rol FROM clientes WHERE id = ?',
                [clienteId]
            );
            
            if (rows.length === 0) return false;
            const roles = this.parseRoles(rows[0].rol);
            return roles.includes(role);
        } catch (error) {
            console.error('Error en hasRole:', error);
            throw error;
        }
    }
}

module.exports = cliente;