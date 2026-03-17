// frontend/js/admin-cotizaciones.js
//const API_URL = 'http://localhost:3000/api';

function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
    } else {
        document.getElementById('adminName').textContent = `👤 ${user.nombre}`;
    }
}

async function cargarCotizaciones() {
    const tbody = document.getElementById('tablaCotizaciones');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Cargando...</td></tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/cotizaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const cotizaciones = await response.json();
        
        if (cotizaciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No hay cotizaciones</td></tr>';
            return;
        }
        
        tbody.innerHTML = cotizaciones.map(cot => `
            <tr>
                <td>${cot.id}</td>
                <td><strong>${cot.cliente || 'Sin cliente'}</strong><br><small>${cot.cliente_email || ''}</small></td>
                <td>${cot.nombre_evento || '-'}</td>
                <td>$${Number(cot.total).toLocaleString('es-MX')}</td>
                <td>
                    <span class="status-badge status-${cot.estado}">
                        ${cot.estado}
                    </span>
                </td>
                <td>${new Date(cot.creado_en).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="verCotizacion(${cot.id})">👁️ Ver</button>
                    <select class="estado-select" onchange="cambiarEstado(${cot.id}, this.value)">
                        <option value="pendiente" ${cot.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="enviada" ${cot.estado === 'enviada' ? 'selected' : ''}>Enviada</option>
                        <option value="aceptada" ${cot.estado === 'aceptada' ? 'selected' : ''}>Aceptada</option>
                        <option value="cancelada" ${cot.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Error al cargar</td></tr>';
    }
}

function verCotizacion(id) {
    window.location.href = `cotizacion-detalle.html?id=${id}`;
}

async function cambiarEstado(id, nuevoEstado) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/cotizaciones/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (response.ok) {
            alert('Estado actualizado');
            cargarCotizaciones();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Filtro por estado
document.getElementById('filtroEstado').addEventListener('change', (e) => {
    const estado = e.target.value;
    if (estado) {
        window.location.href = `admin-cotizaciones.html?estado=${estado}`;
    } else {
        window.location.href = 'admin-cotizaciones.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    cargarCotizaciones();
});