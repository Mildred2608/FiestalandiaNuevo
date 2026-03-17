// frontend/js/admin-eventos.js
//const API_URL = 'http://localhost:3000/api';

function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
    } else {
        document.getElementById('adminName').textContent = `👤 ${user.nombre}`;
    }
}

async function cargarEventos() {
    const tbody = document.getElementById('tablaEventos');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Cargando...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/eventos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const eventos = await response.json();
        
        if (eventos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No hay eventos</td></tr>';
            return;
        }
        
        tbody.innerHTML = eventos.map(ev => `
            <tr>
                <td>${ev.evento_id}</td>
                <td><strong>${ev.nombre_evento || 'Sin nombre'}</strong></td>
                <td>${ev.cliente_nombre || 'Anónimo'}<br><small>${ev.cliente_email || ''}</small></td>
                <td>${ev.tipo || '-'}</td>
                <td>${new Date(ev.fecha).toLocaleDateString()}</td>
                <td>${ev.invitados || '0'} personas</td>
                <td>
                    <button class="action-btn edit-btn" onclick="verEvento(${ev.evento_id})">👁️ Ver</button>
                    <button class="action-btn edit-btn" onclick="editarEvento(${ev.evento_id})">✏️ Editar</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Error al cargar</td></tr>';
    }
}

function verEvento(id) {
    window.location.href = `evento-detalle.html?id=${id}`;
}

function editarEvento(id) {
    window.location.href = `evento-editar.html?id=${id}`;
}

// Filtro por fecha
document.getElementById('filtroFecha').addEventListener('change', (e) => {
    const fecha = e.target.value;
    if (fecha) {
        window.location.href = `admin-eventos.html?fecha=${fecha}`;
    } else {
        window.location.href = 'admin-eventos.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    cargarEventos();
});