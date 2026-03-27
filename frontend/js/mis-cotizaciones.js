// frontend/js/mis-cotizaciones.js
//const API_URL = 'http://localhost:3000/api';

// ===== CARGAR COTIZACIONES DEL CLIENTE =====
async function cargarMisCotizaciones() {
    const container = document.getElementById('cotizacionesContainer');
    
    const user = auth.getCurrentUser();
    if (!user) {
        container.innerHTML = '<div class="no-cotizaciones">Inicia sesión para ver tus cotizaciones</div>';
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/carrito/admin/cliente/cotizaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const cotizaciones = await response.json();
        
        if (cotizaciones.length === 0) {
            container.innerHTML = '<div class="no-cotizaciones">No tienes cotizaciones aún</div>';
            return;
        }
        
        cotizaciones.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        
        container.innerHTML = cotizaciones.map(c => `
            <div class="cotizacion-card ${c.estado}" data-id="${c.id}">
                <div class="cotizacion-header" onclick="toggleDetalle(${c.id})">
                    <div class="cotizacion-info">
                        <div class="cotizacion-info-item">
                            <strong>#${c.id}</strong>
                        </div>
                        <div class="cotizacion-info-item">
                            📅 ${new Date(c.creado_en).toLocaleDateString()}
                        </div>
                        <div class="cotizacion-info-item">
                            📝 ${c.nombre_evento || 'Evento sin nombre'}
                        </div>
                        <div class="cotizacion-info-item">
                            💰 $${Number(c.total).toLocaleString('es-MX')}
                        </div>
                    </div>
                    <div>
                        <span class="cotizacion-estado estado-${c.estado}">${c.estado}</span>
                        <span class="expand-icon">▼</span>
                    </div>
                </div>
                <div class="cotizacion-body" id="detalle-${c.id}">
                    <div class="loading-detalle">Cargando detalles...</div>
                </div>
            </div>
        `).join('');
        
        for (const c of cotizaciones) {
            cargarDetalleCotizacion(c.id);
        }
        
        configurarFiltros();
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="error">Error al cargar cotizaciones</div>';
    }
}

// ===== CONFIGURAR FILTROS =====
function configurarFiltros() {
    const filtros = document.querySelectorAll('.filtro-btn');
    filtros.forEach(btn => {
        btn.addEventListener('click', () => {
            filtros.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const estado = btn.dataset.estado;
            const cards = document.querySelectorAll('.cotizacion-card');
            
            cards.forEach(card => {
                if (estado === 'todas') {
                    card.style.display = 'block';
                } else {
                    card.style.display = card.classList.contains(estado) ? 'block' : 'none';
                }
            });
        });
    });
}

// ===== CARGAR DETALLE DE UNA COTIZACIÓN =====
async function cargarDetalleCotizacion(id) {
    const detalleDiv = document.getElementById(`detalle-${id}`);
    if (!detalleDiv) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/carrito/admin/cliente/cotizaciones/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar detalle');
        }
        
        const data = await response.json();
        
        let serviciosHtml = '';
        if (data.detalles && data.detalles.length > 0) {
            serviciosHtml = data.detalles.map(d => `
                <div class="servicio-item">
                    <div>
                        <div class="servicio-nombre">${d.nombre}</div>
                        <div class="servicio-descripcion">${d.descripcion || ''}</div>
                    </div>
                    <div class="servicio-precio">
                        ${d.cantidad} x $${Number(d.precio_unitario).toLocaleString('es-MX')}
                    </div>
                </div>
            `).join('');
        } else {
            serviciosHtml = '<div class="no-detalles">No hay detalles disponibles</div>';
        }
        
        detalleDiv.innerHTML = `
            <div class="servicios-lista">
                ${serviciosHtml}
            </div>
            <div class="cotizacion-total">
                Total: $${Number(data.total).toLocaleString('es-MX')}
            </div>
            ${data.estado === 'enviada' ? `
                <div class="cotizacion-acciones">
                    <button class="btn-aceptar" onclick="accionCotizacion(${id}, 'aceptar')">✅ Aceptar cotización</button>
                    <button class="btn-rechazar" onclick="accionCotizacion(${id}, 'rechazar')">❌ Rechazar cotización</button>
                </div>
            ` : ''}
        `;
        
    } catch (error) {
        console.error('Error:', error);
        detalleDiv.innerHTML = '<div class="error">Error al cargar detalle</div>';
    }
}

// ===== TOGGLE DETALLE =====
function toggleDetalle(id) {
    const detalle = document.getElementById(`detalle-${id}`);
    if (detalle) {
        detalle.classList.toggle('open');
        const icon = detalle.previousElementSibling?.querySelector('.expand-icon');
        if (icon) {
            icon.style.transform = detalle.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

// ===== ACEPTAR O RECHAZAR COTIZACIÓN =====
async function accionCotizacion(id, accion) {
    const confirmar = confirm(`¿Estás seguro de ${accion === 'aceptar' ? 'aceptar' : 'rechazar'} esta cotización?`);
    if (!confirmar) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/cotizaciones/${id}/${accion}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarToast(data.message || `Cotización ${accion}da`, 'success');
            cargarMisCotizaciones();
        } else {
            mostrarToast(data.message || 'Error al procesar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al procesar', 'error');
    }
}

// ===== TOAST =====
function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast', tipo);
    
    let icono = '';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
    
    toast.innerHTML = `<span class="toast-icon">${icono}</span>${mensaje}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

// ===== ACTUALIZAR BADGE DEL CARRITO =====
async function actualizarBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            const response = await fetch(`${API_URL}/carrito/cantidad`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            badge.textContent = data.total || 0;
            badge.style.display = (data.total > 0) ? 'inline-block' : 'none';
        } catch (error) {
            badge.style.display = 'none';
        }
    } else {
        badge.style.display = 'none';
    }
}

// ===== FUNCIONES DE AUTENTICACIÓN =====
function actualizarBotonLogin() {
    const loginBtn = document.getElementById('loginBtn');
    const user = auth.getCurrentUser();
    
    if (user && loginBtn) {
        loginBtn.innerHTML = `👤 ${user.nombre}`;
        loginBtn.classList.add('logged-in');
        loginBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        };
    } else if (loginBtn) {
        loginBtn.innerHTML = '🔐 Login';
        loginBtn.classList.remove('logged-in');
        loginBtn.onclick = (e) => {
            e.preventDefault();
            document.getElementById('authModal').style.display = 'flex';
        };
    }
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (menu) menu.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Mis Cotizaciones iniciado');
    actualizarBotonLogin();
    actualizarBadge();
    cargarMisCotizaciones();
});

// Exponer funciones globales
window.toggleDetalle = toggleDetalle;
window.accionCotizacion = accionCotizacion;
window.toggleMenu = toggleMenu;