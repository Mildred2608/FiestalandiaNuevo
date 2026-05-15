# 🔐 Sistema de Roles Múltiples - Implementación Completada

## 📋 Resumen de Cambios

Se ha implementado un sistema donde los usuarios pueden tener **múltiples roles simultáneamente** (ej: `cliente,proveedor`). Cuando un cliente registra un servicio y es aprobado por admin, **automáticamente recibe el rol `proveedor`**.

---

## 🔄 Flujo de la Aplicación

```
1. Cliente se registra → rol: "cliente"
2. Cliente solicita registrar servicio → estado: "pendiente"
3. Admin aprueba solicitud → Cliente recibe rol: "cliente,proveedor"
4. Cliente puede acceder a vistas de proveedor después de login
```

---

## 📁 Archivos Modificados

### Backend

#### 1. **[src/models/cliente.js](backend/src/models/cliente.js)**
**Cambios:**
- ✅ Agregadas 3 nuevos métodos:
  - `parseRoles()` - Convierte string "cliente,proveedor" a array
  - `addRole()` - Agrega un nuevo rol a un cliente
  - `hasRole()` - Verifica si un cliente tiene un rol específico

**Ejemplo de uso:**
```javascript
// Obtener roles como array
const roles = Cliente.parseRoles(user.rol); // "cliente,proveedor" → ["cliente", "proveedor"]

// Agregar rol
await Cliente.addRole(userId, 'proveedor');

// Verificar rol
const esProveedor = await Cliente.hasRole(userId, 'proveedor');
```

---

#### 2. **[src/controllers/authController.js](backend/src/controllers/authController.js)**
**Cambios:**
- ✅ Método `login()` - Ahora devuelve `roles` como array en JWT y respuesta
- ✅ Método `register()` - Devuelve `roles` como array (inicialmente `["cliente"]`)

**Respuesta actualizada:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "nombre": "Juan",
    "email": "juan@email.com",
    "roles": ["cliente", "proveedor"]  ← Ahora es un array
  }
}
```

---

#### 3. **[src/middlewares/authMiddleware.js](backend/src/middlewares/authMiddleware.js)**
**Cambios:**
- ✅ Nuevo método `hasRole(role)` - Middleware flexible para verificar cualquier rol
- ✅ Método `isAdmin()` - Actualizado para soportar múltiples roles
- ✅ Nuevo método `isProveedor()` - Verifica si es proveedor

**Uso en rutas:**
```javascript
// Antes (ENUM - solo un rol)
router.get('/admin/datos', authMiddleware.isAdmin, ...);

// Después (Múltiples roles)
router.get('/proveedor/dashboard', authMiddleware.hasRole('proveedor'), ...);
```

---

#### 4. **[src/routes/solicitudesRoutes.js](backend/src/routes/solicitudesRoutes.js)**
**Cambios (Endpoint: POST `/admin/solicitudes-registro/:id/aprobar`):**
- ✅ Agregado paso 5: **Agregar automáticamente rol `proveedor` al cliente**
- El cliente recibe el rol cuando su solicitud es aprobada
- Se valida para no agregar duplicados

**Código agregado:**
```javascript
// 5. AGREGAR ROL PROVEEDOR AL CLIENTE
const [clienteActual] = await connection.query(
    'SELECT rol FROM clientes WHERE id = ?',
    [sol.cliente_id]
);

if (clienteActual.length > 0) {
    const rolesActuales = clienteActual[0].rol 
        ? clienteActual[0].rol.split(',').map(r => r.trim()) 
        : ['cliente'];
    
    if (!rolesActuales.includes('proveedor')) {
        rolesActuales.push('proveedor');
        const rolesActualizados = rolesActuales.join(',');
        
        await connection.query(
            'UPDATE clientes SET rol = ? WHERE id = ?',
            [rolesActualizados, sol.cliente_id]
        );
    }
}
```

---

### Frontend

#### 5. **[js/auth.js](frontend/js/auth.js)**
**Cambios:**
- ✅ Actualizado `login()` y `register()` para manejar `roles` como array
- ✅ Nuevas funciones utilitarias:
  - `getUserRoles()` - Obtiene los roles como array
  - `hasRole(role)` - Verifica si el usuario tiene un rol
  - `isAdmin()` - Verifica si es admin
  - `isProveedor()` - Verifica si es proveedor
  - `isCliente()` - Verifica si es cliente

**Ejemplo de uso en HTML:**
```javascript
// En cualquier página frontend
const user = getCurrentUser();
const roles = getUserRoles(); // ["cliente", "proveedor"]

// Mostrar/ocultar secciones según rol
if (isProveedor()) {
    document.getElementById('panel-proveedor').style.display = 'block';
}
```

---

## 🗄️ Base de Datos

#### 6. **[scripts/migration_multiple_roles.sql](backend/scripts/migration_multiple_roles.sql)**
**SQL a ejecutar:**

```sql
-- Cambiar el tipo de dato del campo 'rol'
ALTER TABLE clientes MODIFY COLUMN rol VARCHAR(100) DEFAULT 'cliente';
```

**Antes:**
```
rol ENUM('cliente', 'admin', 'proveedor')
```

**Después:**
```
rol VARCHAR(100)  -- Ejemplos: 'cliente', 'cliente,proveedor', 'cliente,proveedor,admin'
```

---

## ✅ Pasos para Activar

### 1. Ejecutar migración en BD
```bash
# Conectarse a MySQL
mysql -u root -p

# En MySQL
USE fiestalandia;
ALTER TABLE clientes MODIFY COLUMN rol VARCHAR(100) DEFAULT 'cliente';
```

### 2. Reiniciar el servidor backend
```bash
cd backend
npm start
```

### 3. Probar el flujo completo

#### Prueba 1: Login con múltiples roles
```bash
POST /api/auth/login
{
  "email": "usuario@email.com",
  "password": "contraseña"
}

Respuesta:
{
  "success": true,
  "user": {
    "id": 1,
    "roles": ["cliente", "proveedor"]  ← Array de roles
  }
}
```

#### Prueba 2: Proteger ruta de proveedor
```bash
# En las rutas del backend
router.post('/proveedor/crear-servicio',
    authMiddleware.verifyToken,
    authMiddleware.hasRole('proveedor'),  ← Solo si es proveedor
    (req, res) => { ... }
);
```

#### Prueba 3: Frontend - Mostrar secciones según rol
```javascript
// En cualquier página, luego de login
if (isProveedor()) {
    // Mostrar panel de proveedor
    document.getElementById('proveedor-panel').classList.remove('hidden');
}
```

---

## 🔗 Integración con Rutas Existentes

### Rutas que necesitan actualización (usar `authMiddleware.hasRole()`)

1. **Rutas de proveedor** (crear nuevas):
   ```javascript
   router.get('/proveedor/servicios',
       authMiddleware.verifyToken,
       authMiddleware.hasRole('proveedor'),
       proveedorController.getMisServicios
   );
   ```

2. **Rutas de admin** (pueden mantener `.isAdmin()` por compatibilidad):
   ```javascript
   router.get('/admin/solicitudes',
       authMiddleware.verifyToken,
       authMiddleware.isAdmin,  // ← Sigue funcionando igual
       solicitudesController.obtenerSolicitudes
   );
   ```

---

## 📊 Tabla de Compatibilidad

| Acción | Token | BD | Respuesta | Resultado |
|--------|-------|----|-----------| ----------|
| Login usuario "cliente" | `roles: ["cliente"]` | `"cliente"` | `roles: ["cliente"]` | ✅ |
| Login usuario "proveedor" | `roles: ["cliente","proveedor"]` | `"cliente,proveedor"` | `roles: ["cliente","proveedor"]` | ✅ |
| Verificar `hasRole('proveedor')` | Array incluye 'proveedor' | - | Acceso concedido | ✅ |
| Verificar `isAdmin()` | Array incluye 'admin' | - | Acceso concedido | ✅ |

---

## 🚀 Ventajas de esta implementación

✅ **Escalable** - Fácil agregar más roles en el futuro  
✅ **Flexible** - Un usuario puede tener múltiples roles  
✅ **Seguro** - Roles verificados en middleware  
✅ **Compatible** - No rompe el código existente  
✅ **Automático** - Roles se asignan al aprobar solicitud  

---

## 📝 Próximos Pasos (Opcional)

1. Crear rutas `/proveedor/` para funcionalidades del proveedor
2. Crear componentes de UI para mostrar "Panel de Proveedor"
3. Agregar endpoint para crear/editar servicios como proveedor
4. Agregar dashboard separado para proveedores

---

**¡Implementación completada! 🎉**
