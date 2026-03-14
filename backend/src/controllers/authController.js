// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Cliente = require('../models/cliente');

const authController = {
    // LOGIN
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validar que enviaron email y password
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }

            console.log(' Intentando login para:', email);

            // Buscar usuario por email
            const user = await Cliente.findByEmail(email);

            // Si no existe el usuario
            if (!user) {
                console.log(' Usuario no encontrado:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                console.log(' Contraseña incorrecta para:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Generar token JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    nombre: user.nombre,
                    rol: user.rol
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            console.log(' Login exitoso para:', email);

            // Responder con éxito
            res.json({
                success: true,
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email,
                    rol: user.rol
                }
            });

        } catch (error) {
            console.error(' Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    },

    // REGISTER
    async register(req, res) {
        try {
            const { nombre, email, telefono, direccion, password } = req.body;

            // Validaciones básicas
            if (!nombre || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, email y contraseña son requeridos'
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 8 caracteres'
                });
            }

            console.log(' Intentando registrar:', email);

            // Verificar si el email ya existe
            const existingUser = await Cliente.findByEmail(email);
            if (existingUser) {
                console.log(' Email ya registrado:', email);
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Encriptar password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Crear usuario
            const [result] = await require('../config/database').pool.query(
                `INSERT INTO clientes (nombre, email, telefono, direccion, password_hash) 
                 VALUES (?, ?, ?, ?, ?)`,
                [nombre, email, telefono || null, direccion || null, password_hash]
            );

            // Generar token
            const token = jwt.sign(
                { id: result.insertId, email, nombre, rol: 'cliente' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            console.log(' Registro exitoso para:', email);

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                token,
                user: {
                    id: result.insertId,
                    nombre,
                    email,
                    rol: 'cliente'
                }
            });

        } catch (error) {
            console.error(' Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }
    }
};

module.exports = authController;