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

    // Verificar si el usuario tiene un rol específico (soporta múltiples roles)
    hasRole(requiredRole) {
        return (req, res, next) => {
            // Convertir roles a array si es string (compatibilidad hacia atrás)
            const userRoles = Array.isArray(req.user.roles) 
                ? req.user.roles 
                : (req.user.rol ? [req.user.rol] : []);

            if (!userRoles.includes(requiredRole)) {
                return res.status(403).json({ 
                    success: false,
                    message: `Acceso denegado. Se requieren permisos de ${requiredRole}` 
                });
            }
            next();
        };
    },

    // Verificar si es administrador (deprecated - usar hasRole('admin') en su lugar)
    isAdmin(req, res, next) {
        const userRoles = Array.isArray(req.user.roles) 
            ? req.user.roles 
            : (req.user.rol ? [req.user.rol] : []);

        if (!userRoles.includes('admin')) {
            return res.status(403).json({ 
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador' 
            });
        }
        next();
    },

    // Verificar si es proveedor
    isProveedor(req, res, next) {
        const userRoles = Array.isArray(req.user.roles) 
            ? req.user.roles 
            : (req.user.rol ? [req.user.rol] : []);

        if (!userRoles.includes('proveedor')) {
            return res.status(403).json({ 
                success: false,
                message: 'Acceso denegado. Se requieren permisos de proveedor' 
            });
        }
        next();
    }
};

module.exports = authMiddleware;