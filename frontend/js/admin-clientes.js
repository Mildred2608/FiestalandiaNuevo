// frontend/js/admin-clientes.js
//mysconst API_URL = 'http://localhost:3000/api';

function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
    }
}

async function cargarClientes() {
    const tbody = document.getElementById('tablaClientes');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Cargando...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const clientes = await response.json();
        
        if (clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No hay clientes</td></tr>';
            return;
        }
        
        tbody.innerHTML = clientes.map(cliente => `
            <tr>
                <td>${cliente.id}</td>
                <td><strong>${cliente.nombre}</strong></td>
                <td>${cliente.email}</td>
                <td>${cliente.telefono || '-'}</td>
                <td><span class="status-badge ${cliente.rol === 'admin' ? 'status-active' : 'status-inactive'}">${cliente.rol}</span></td>
                <td>${new Date(cliente.creado_en).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="verCliente(${cliente.id})">👁️ Ver</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Error al cargar</td></tr>';
    }
}

function verCliente(id) {
    alert(`Ver detalles del cliente ${id}`);
}

// Búsqueda en tiempo real
document.getElementById('buscarCliente').addEventListener('input', (e) => {
    const busqueda = e.target.value.toLowerCase();
    const filas = document.querySelectorAll('#tablaClientes tr');
    
    filas.forEach(fila => {
        if (fila.querySelector('td')) {
            const texto = fila.textContent.toLowerCase();
            fila.style.display = texto.includes(busqueda) ? '' : 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    cargarClientes();
});