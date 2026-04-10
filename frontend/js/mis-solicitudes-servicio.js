// frontend/js/mis-solicitudes-servicio.js
//const API_URL = 'http://localhost:3000/api';

// ===== CARGAR MIS SOLICITUDES =====
async function cargarMisSolicitudes() {
    const container = document.getElementById('solicitudesContainer');
    
    const user = auth.getCurrentUser();
    if (!user) {
        container.innerHTML = '<div class="no-solicitudes">Inicia sesión para ver tus solicitudes</div>';
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/cliente/mis-solicitudes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const solicitudes = await response.json();
        
        if (solicitudes.length === 0) {
            container.innerHTML = `
                <div class="no-solicitudes">
                    <p>No tienes solicitudes de registro de servicios</p>
                    <button class="btn-nueva-solicitud" onclick="window.location.href='solicitar-registro-servicio.html'" style="margin-top: 20px;">
                        + Solicitar registro de mi servicio
                    </button>
                </div>
            `;
            return;
        }
        
        solicitudes.sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
        
        container.innerHTML = solicitudes.map(s => `
            <div class="solicitud-card ${s.estado}" data-id="${s.id}">
                <div class="solicitud-header" onclick="toggleDetalle(${s.id})">
                    <div class="solicitud-info">
                        <div class="solicitud-info-item">
                            <strong>#${s.id}</strong>
                        </div>
                        <div class="solicitud-info-item">
                            📅 ${new Date(s.fecha_solicitud).toLocaleDateString()}
                        </div>
                        <div class="solicitud-info-item">
                            🏷️ ${s.nombre_servicio}
                        </div>
                        <div class="solicitud-info-item">
                            💰 $${Number(s.precio_propuesto).toLocaleString('es-MX')}
                        </div>
                    </div>
                    <div>
                        <span class="solicitud-estado estado-${s.estado}">${s.estado}</span>
                        <span class="expand-icon">▼</span>
                    </div>
                </div>
                <div class="solicitud-body" id="detalle-${s.id}">
                    <div class="solicitud-detalle">
                        <div class="detalle-item">
                            <span class="detalle-label">Servicio:</span>
                            <span class="detalle-valor">${s.nombre_servicio}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Categoría:</span>
                            <span class="detalle-valor">${s.categoria_nombre || 'N/A'}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Subcategoría:</span>
                            <span class="detalle-valor">${s.subcategoria_nombre || s.nueva_subcategoria || 'N/A'}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Descripción:</span>
                            <span class="detalle-valor">${s.descripcion || 'Sin descripción'}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Precio propuesto:</span>
                            <span class="detalle-valor">$${Number(s.precio_propuesto).toLocaleString('es-MX')} ${s.moneda || 'MXN'}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Negocio:</span>
                            <span class="detalle-valor">${s.proveedor_nombre}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Email contacto:</span>
                            <span class="detalle-valor">${s.proveedor_email}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Teléfono:</span>
                            <span class="detalle-valor">${s.proveedor_telefono || 'N/A'}</span>
                        </div>
                        ${s.estado === 'aprobada' ? `
                            <div class="detalle-item" style="background: #d1fae5; padding: 10px; border-radius: 8px; margin-top: 10px;">
                                <span class="detalle-label">✅ Aprobada!</span>
                                <span class="detalle-valor">Tu servicio ha sido registrado exitosamente. Ahora aparece en el catálogo.</span>
                            </div>
                        ` : ''}
                        ${s.estado === 'rechazada' ? `
                            <div class="detalle-item" style="background: #fee2e2; padding: 10px; border-radius: 8px; margin-top: 10px;">
                                <span class="detalle-label">❌ Rechazada</span>
                                <span class="detalle-valor">${s.observaciones_admin || 'No se proporcionó motivo. Puedes volver a intentarlo.'}</span>
                            </div>
                        ` : ''}
                        ${s.observaciones_admin && s.estado !== 'rechazada' ? `
                            <div class="detalle-item">
                                <span class="detalle-label">Observaciones:</span>
                                <span class="detalle-valor">${s.observaciones_admin}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        configurarFiltros();
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="no-solicitudes">Error al cargar solicitudes</div>';
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
            const cards = document.querySelectorAll('.solicitud-card');
            
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

// ===== ACTUALIZAR BADGE DEL CARRITO =====
function actualizarBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    
    const token = localStorage.getItem('token');
    
    if (token) {
        fetch(`${API_URL}/carrito/cantidad`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            badge.textContent = data.total || 0;
            badge.style.display = (data.total > 0) ? 'inline-block' : 'none';
        })
        .catch(err => {
            console.error('Error al obtener total:', err);
            // Fallback a localStorage
            try {
                const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
                const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
                badge.textContent = total;
                badge.style.display = total > 0 ? 'inline-block' : 'none';
            } catch (e) {
                badge.style.display = 'none';
            }
        });
    } else {
        try {
            const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
            const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
            badge.textContent = total;
            badge.style.display = total > 0 ? 'inline-block' : 'none';
        } catch (e) {
            badge.style.display = 'none';
        }
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
            mostrarMenuUsuario(user);
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

function mostrarMenuUsuario(user) {
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) existingMenu.remove();
    
    let menuContent = `
        <div class="user-menu-header">
            <strong>${user.nombre}</strong>
            <small>${user.email}</small>
        </div>
        <div class="user-menu-items">
            <a href="perfil.html">👤 Mi Perfil</a>
            <a href="mis-eventos.html">📅 Mis Eventos</a>
            <a href="mis-cotizaciones.html">💰 Mis Cotizaciones</a>
            <a href="solicitar-registro-servicio.html" class="menu-solicitar">📋 Registrar mi servicio</a>
            <a href="mis-solicitudes-servicio.html" class="menu-solicitudes">📋 Mis solicitudes</a>
    `;
    
    if (user.rol === 'admin') {
        menuContent += `
            <a href="admin.html">👑 Panel Admin</a>
        `;
    }
    
    menuContent += `
            <hr>
            <a href="#" onclick="cerrarSesion()" style="color: #dc3545;">🚪 Cerrar Sesión</a>
        </div>
    `;
    
    const userMenu = document.createElement('div');
    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu';
    userMenu.innerHTML = menuContent;
    document.body.appendChild(userMenu);
    
    const loginBtn = document.getElementById('loginBtn');
    const rect = loginBtn.getBoundingClientRect();
    userMenu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    userMenu.style.left = (rect.left + window.scrollX - 100) + 'px';
    userMenu.style.display = 'block';
}

function verPerfil() {
    const user = auth.getCurrentUser();
    alert(`👤 ${user.nombre}\n📧 ${user.email}\n📱 ${user.telefono || 'No especificado'}`);
    document.getElementById('userMenu').style.display = 'none';
}

function cerrarSesion() {
    auth.logout();
    window.location.reload();
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    menu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Mis Solicitudes de Servicio iniciado');
    actualizarBotonLogin();
    actualizarBadge();
    cargarMisSolicitudes();
});

// Exponer funciones globales
window.toggleDetalle = toggleDetalle;
window.toggleMenu = toggleMenu;