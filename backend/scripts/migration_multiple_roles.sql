-- ============================================
-- MIGRACIÓN: Soporte para múltiples roles por usuario
-- ============================================
-- Esta migración cambia el campo 'rol' de ENUM a VARCHAR
-- para permitir que un usuario tenga múltiples roles
-- Ejemplo: "cliente,proveedor" o "cliente,proveedor,admin"

USE fiestalandia;

-- 1. Cambiar el tipo de dato del campo 'rol'
-- De: ENUM('cliente', 'admin', 'proveedor')
-- A: VARCHAR(100)
ALTER TABLE clientes MODIFY COLUMN rol VARCHAR(100) DEFAULT 'cliente';

-- 2. Conversión de valores existentes (si es necesario)
-- Los valores ENUM se convierten automáticamente a strings
-- Ejemplo: 'cliente' → 'cliente', 'admin' → 'admin', etc.

-- 3. Si quieres verificar que todo quedó bien:
-- SELECT id, nombre, email, rol FROM clientes;

-- 4. Notas importantes:
-- - Ahora los roles se almacenan separados por comas: "cliente,proveedor"
-- - El código backend parsea estos valores automáticamente
-- - Usa la función Cliente.parseRoles() para obtenerlos como array
-- - El middleware authMiddleware ahora soporta múltiples roles

COMMIT;
