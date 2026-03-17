const API_URL = 'http://localhost:3000/api';

async function cargarMisCotizaciones() {
    const container = document.getElementById('cotizaciones-container');
    
    const user = auth.getCurrentUser();
    if (!user) {
        container.innerHTML = '<p class="no-data">Inicia sesión para ver tus cotizaciones</p>';
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/cliente/cotizaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const cotizaciones = await response.json();
        
        if (cotizaciones.length === 0) {
            container.innerHTML = '<p class="no-data">No tienes cotizaciones aún</p>';
            return;
        }
        
        container.innerHTML = cotizaciones.map(c => `
            <div class="card">
                <h3>${c.nombre_evento || 'Evento'}</h3>
                <p>Total: $${Number(c.total).toLocaleString('es-MX')}</p>
                <p>Estado: <span class="status-badge status-${c.estado}">${c.estado}</span></p>
                <p>Fecha: ${new Date(c.creado_en).toLocaleDateString()}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="error">Error al cargar cotizaciones</p>';
    }
}

document.addEventListener('DOMContentLoaded', cargarMisCotizaciones);