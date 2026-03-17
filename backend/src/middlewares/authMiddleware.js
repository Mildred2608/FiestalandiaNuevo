// backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = {
    // Verificar token
    verifyToken(req, res, next) {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Acceso denegado. Token requerido' 
            });
        }

        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            req.user = verified;
            next();
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                message: 'Token inválido' 
            });
        }
    },

    // Verificar si es administrador
    isAdmin(req, res, next) {
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador' 
            });
        }
        next();
    }
};

module.exports = authMiddleware;