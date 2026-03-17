// frontend/js/admin.js
//const API_URL = 'http://localhost:3000/api';

// ===== VERIFICAR SESIÓN DE ADMIN =====
function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
    } else {
        document.getElementById('adminName').textContent = `👤 ${user.nombre}`;
    }
}

// ===== TABS =====
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
        
        // Cargar datos según el tab
        if (tab.dataset.tab === 'categorias') cargarCategorias();
        if (tab.dataset.tab === 'subcategorias') cargarSubcategorias();
        if (tab.dataset.tab === 'servicios') cargarServicios();
    });
});

// ===== CATEGORÍAS =====
async function cargarCategorias() {
    const tbody = document.getElementById('tablaCategorias');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Cargando...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/categorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const categorias = await response.json();
        
        if (categorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-row">No hay categorías</td></tr>';
            return;
        }
        
        tbody.innerHTML = categorias.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${cat.imagen_url ? '🖼️' : '📁'}</td>
                <td><strong>${cat.nombre}</strong></td>
                <td>${cat.descripcion || ''}</td>
                <td>${new Date(cat.creado_en).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarCategoria(${cat.id})">✏️ Editar</button>
                    <button class="action-btn delete-btn" onclick="eliminarCategoria(${cat.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Error al cargar</td></tr>';
    }
}

// ===== SUBCATEGORÍAS =====
async function cargarSubcategorias() {
    const tbody = document.getElementById('tablaSubcategorias');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Cargando...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/subcategorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const subcategorias = await response.json();
        
        if (subcategorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-row">No hay subcategorías</td></tr>';
            return;
        }
        
        tbody.innerHTML = subcategorias.map(sub => `
            <tr>
                <td>${sub.id}</td>
                <td>${sub.categoria_nombre || 'Sin categoría'}</td>
                <td><strong>${sub.nombre}</strong></td>
                <td>${sub.descripcion || ''}</td>
                <td>${new Date(sub.creado_en).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarSubcategoria(${sub.id})">✏️ Editar</button>
                    <button class="action-btn delete-btn" onclick="eliminarSubcategoria(${sub.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Error al cargar</td></tr>';
    }
}

// ===== SERVICIOS (CON OPCIONES DE EDICIÓN Y ELIMINACIÓN) =====
async function cargarServicios() {
    const tbody = document.getElementById('tablaServicios');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Cargando...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/servicios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const servicios = await response.json();
        
        if (servicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No hay servicios</td></tr>';
            return;
        }
        
        tbody.innerHTML = servicios.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.subcategoria_nombre || '-'}</td>
                <td>${s.proveedor_nombre || '-'}</td>
                <td><strong>${s.nombre}</strong></td>
                <td>$${Number(s.precio_base).toLocaleString('es-MX')}</td>
                <td>
                    <span class="status-badge ${s.activo ? 'status-active' : 'status-inactive'}">
                        ${s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarServicio(${s.id})">✏️ Editar</button>
                    ${s.activo 
                        ? `<button class="action-btn delete-btn" onclick="toggleServicio(${s.id}, 'desactivar')">🗑️ Desactivar</button>`
                        : `<button class="action-btn edit-btn" onclick="toggleServicio(${s.id}, 'reactivar')">🔄 Reactivar</button>`
                    }
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Error al cargar</td></tr>';
    }
}

// ===== FUNCIONES PARA SERVICIOS =====
async function editarServicio(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/servicios/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const servicio = await response.json();
        
        // Aquí puedes abrir un modal con los datos del servicio para editar
        console.log('Editar servicio:', servicio);
        alert(`Función de editar servicio ${id} - Implementar modal`);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el servicio');
    }
}

async function toggleServicio(id, accion) {
    if (!confirm(`¿Estás seguro de ${accion === 'desactivar' ? 'desactivar' : 'reactivar'} este servicio?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const url = accion === 'desactivar' 
            ? `${API_URL}/admin/servicios/${id}`
            : `${API_URL}/admin/servicios/${id}/reactivar`;
        
        const method = accion === 'desactivar' ? 'DELETE' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert(`Servicio ${accion === 'desactivar' ? 'desactivado' : 'reactivado'} exitosamente`);
            cargarServicios(); // Recargar la tabla
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(' Error al procesar la solicitud');
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    cargarCategorias();
});