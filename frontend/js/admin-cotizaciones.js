// frontend/js/admin-cotizaciones.js
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

async function cargarCotizaciones() {
    const tbody = document.getElementById('tablaCotizaciones');
    tbody.innerHTML = '\\u003ctr><td colspan="7" class="loading-row">Cargando...\\u003c/td>\\u003c/tr>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/carrito/admin/cotizaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const cotizaciones = await response.json();
        
        if (cotizaciones.length === 0) {
            tbody.innerHTML = '\\u003ctr><td colspan="7" class="loading-row">No hay cotizaciones\\u003c/td>\\u003c/tr>';
            return;
        }
        
        tbody.innerHTML = cotizaciones.map(cot => `
            <tr>
                <td style="font-weight: 600;">#${cot.id}</td>
                <td>
                    <strong>${cot.cliente_nombre || cot.cliente || 'Sin cliente'}</strong>
                    <br><small>${cot.cliente_email || ''}</small>
                </td>
                <td>${cot.nombre_evento || '-'}</td>
                <td style="color: #ec4899; font-weight: 600;">
                    $${Number(cot.total).toLocaleString('es-MX')}
                </td>
                <td>
                    <span class="status-badge estado-${cot.estado}">
                        ${cot.estado}
                    </span>
                </td>
                <td>${new Date(cot.creado_en).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="verCotizacion(${cot.id})">👁️ Ver detalles</button>
                </td>
             </tr>
        `).join('');
        
        // Filtrar por estado si viene en URL
        const urlParams = new URLSearchParams(window.location.search);
        const estadoFiltro = urlParams.get('estado');
        if (estadoFiltro) {
            const filtroSelect = document.getElementById('filtroEstado');
            if (filtroSelect) filtroSelect.value = estadoFiltro;
            filtrarPorEstado(estadoFiltro);
        }
        
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '\\u003ctr><td colspan="7" class="loading-row">Error al cargar\\u003c/td>\\u003c/tr>';
    }
}

function verCotizacion(id) {
    window.location.href = `cotizacion-detalle.html?id=${id}`;
}

function filtrarPorEstado(estado) {
    const filas = document.querySelectorAll('#tablaCotizaciones tr');
    filas.forEach(fila => {
        if (fila.querySelector('td')) {
            const estadoCelda = fila.querySelector('td:nth-child(5) .status-badge')?.textContent.trim();
            if (estado) {
                fila.style.display = estadoCelda === estado ? '' : 'none';
            } else {
                fila.style.display = '';
            }
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
    console.log('Admin Cotizaciones iniciado (solo lectura)');
    checkAdminAuth();
    cargarCotizaciones();
    
    // Filtro por estado (solo visual, sin modificar)
    const filtroEstado = document.getElementById('filtroEstado');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', (e) => {
            const estado = e.target.value;
            if (estado) {
                window.location.href = `admin-cotizaciones.html?estado=${estado}`;
            } else {
                window.location.href = 'admin-cotizaciones.html';
            }
        });
    }
});

// Exponer funciones globales
window.verCotizacion = verCotizacion;
window.toggleMenu = toggleMenu;