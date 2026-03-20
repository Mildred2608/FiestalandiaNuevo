// frontend/js/admin-proveedores.js
//const API_URL = 'http://localhost:3000/api';

function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
    } else {
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = `👤 ${user.nombre}`;
        }
    }
}

async function cargarProveedores() {
    const tbody = document.getElementById('tablaProveedores');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Cargando...\\u003c/td>\\u003c/tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/proveedores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const proveedores = await response.json();
        
        if (proveedores.length === 0) {
            tbody.innerHTML = '\\u003ctr><td colspan="7" class="loading-row">No hay proveedores\\u003c/td>\\u003c/tr>';
            return;
        }
        
        tbody.innerHTML = proveedores.map(prov => `
            <tr>
                <td>${prov.id}</td>
                <td><strong>${prov.nombre}</strong></td>
                <td>${prov.email}</td>
                <td>${prov.telefono || '-'}</td>
                <td>
                    <span class="status-badge ${prov.aprobado ? 'status-active' : 'status-inactive'}">
                        ${prov.aprobado ? 'Aprobado' : 'Pendiente'}
                    </span>
                </td>
                <td>${new Date(prov.creado_en).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarProveedor(${prov.id})">✏️ Editar</button>
                    <button class="action-btn ${prov.aprobado ? 'delete-btn' : 'edit-btn'}" 
                            onclick="toggleAprobacion(${prov.id}, ${prov.aprobado})">
                        ${prov.aprobado ? '🔴 Desactivar' : '🟢 Aprobar'}
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '\\u003ctr><td colspan="7" class="loading-row">Error al cargar\\u003c/td>\\u003c/tr>';
    }
}

async function editarProveedor(id) {
    const nombre = prompt('Nuevo nombre del proveedor:');
    if (!nombre) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/proveedores/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre })
        });
        
        if (response.ok) {
            alert('Proveedor actualizado');
            cargarProveedores();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar proveedor');
    }
}

async function toggleAprobacion(id, estadoActual) {
    const accion = estadoActual ? 'desactivar' : 'aprobar';
    if (!confirm(`¿Estás seguro de ${accion} este proveedor?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/proveedores/${id}/toggle`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert(`Proveedor ${accion}do`);
            cargarProveedores();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar estado');
    }
}

// Modal para nuevo proveedor
function initModalProveedor() {
    // Verificar si el modal ya existe para no duplicarlo
    if (document.getElementById('modalProveedor')) return;
    
    const modalHTML = `
    <div class="modal" id="modalProveedor" style="display: none;">
        <div class="modal-content">
            <span class="modal-close" id="closeModalProveedor">&times;</span>
            <h2>Nuevo Proveedor</h2>
            <form id="formProveedor">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" id="provNombre" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="provEmail" required>
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" id="provTelefono">
                </div>
                <div class="form-group">
                    <label>Dirección</label>
                    <textarea id="provDireccion" rows="2"></textarea>
                </div>
                <button type="submit" class="modal-btn">Guardar</button>
            </form>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Eventos del modal
    const modal = document.getElementById('modalProveedor');
    const closeBtn = document.getElementById('closeModalProveedor');
    const form = document.getElementById('formProveedor');
    const btnNuevo = document.getElementById('btnNuevoProveedor');
    
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nuevoProveedor = {
                nombre: document.getElementById('provNombre').value,
                email: document.getElementById('provEmail').value,
                telefono: document.getElementById('provTelefono').value,
                direccion: document.getElementById('provDireccion').value
            };
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/admin/proveedores`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(nuevoProveedor)
                });
                
                if (response.ok) {
                    alert('Proveedor creado exitosamente');
                    modal.style.display = 'none';
                    form.reset();
                    cargarProveedores();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Error al crear proveedor');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            }
        });
    }
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (menu) menu.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Proveedores iniciado');
    checkAdminAuth();
    cargarProveedores();
    initModalProveedor();
});

// Exponer funciones globales
window.editarProveedor = editarProveedor;
window.toggleAprobacion = toggleAprobacion;
window.toggleMenu = toggleMenu;