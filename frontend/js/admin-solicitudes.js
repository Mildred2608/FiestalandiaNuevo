// frontend/js/admin-solicitudes.js
//const API_URL = 'http://localhost:3000/api';

let solicitudesData = [];
let currentFilter = 'pendiente';
let solicitudIdAccion = null;
let accionActual = null;

// ===== VERIFICAR AUTENTICACIÓN =====
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

// ===== CARGAR SOLICITUDES =====
async function cargarSolicitudes() {
    const container = document.getElementById('solicitudesContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">Cargando solicitudes...</div>';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/solicitudes-registro`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        solicitudesData = await response.json();
        filtrarSolicitudes(currentFilter);
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="no-solicitudes">Error al cargar solicitudes</div>';
    }
}

// ===== FILTRAR SOLICITUDES =====
function filtrarSolicitudes(estado) {
    currentFilter = estado;
    const container = document.getElementById('solicitudesContainer');
    if (!container) return;
    
    // Actualizar tabs
    document.querySelectorAll('.solicitud-tab').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.estado === estado) {
            t.classList.add('active');
        }
    });
    
    let filtradas = [];
    if (estado === 'todas') {
        filtradas = solicitudesData;
    } else {
        filtradas = solicitudesData.filter(s => s.estado === estado);
    }
    
    if (filtradas.length === 0) {
        container.innerHTML = `<div class="no-solicitudes">No hay solicitudes ${estado !== 'todas' ? estado : ''}</div>`;
        return;
    }
    
    container.innerHTML = filtradas.map(s => crearCardSolicitud(s)).join('');
}

// ===== CREAR CARD DE SOLICITUD =====
function crearCardSolicitud(s) {
    const fecha = new Date(s.fecha_solicitud).toLocaleDateString();
    const inicial = s.cliente_nombre ? s.cliente_nombre.charAt(0).toUpperCase() : '?';
    
    return `
        <div class="solicitud-card ${s.estado}" onclick="verDetalleSolicitud(${s.id})">
            <div class="solicitud-header">
                <div class="solicitud-cliente">
                    <div class="cliente-avatar">${inicial}</div>
                    <div class="cliente-info">
                        <h4>${s.cliente_nombre || 'Cliente'}</h4>
                        <p>${s.cliente_email || ''}</p>
                    </div>
                </div>
                <span class="solicitud-estado estado-${s.estado}">${s.estado}</span>
            </div>
            
            <div class="solicitud-body">
                <div class="info-group">
                    <h5>Servicio solicitado</h5>
                    <div class="info-item">
                        <strong>Nombre:</strong> <span>${s.nombre_servicio}</span>
                    </div>
                    <div class="info-item">
                        <strong>Categoría:</strong> <span>${s.categoria_nombre || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Precio:</strong> <span>$${Number(s.precio_propuesto).toLocaleString('es-MX')} ${s.moneda}</span>
                    </div>
                </div>
                
                <div class="info-group">
                    <h5>Proveedor</h5>
                    <div class="info-item">
                        <strong>Negocio:</strong> <span>${s.proveedor_nombre}</span>
                    </div>
                    <div class="info-item">
                        <strong>Email:</strong> <span>${s.proveedor_email}</span>
                    </div>
                    <div class="info-item">
                        <strong>Teléfono:</strong> <span>${s.proveedor_telefono || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="solicitud-footer">
                <span class="solicitud-fecha">📅 ${fecha}</span>
                <div class="solicitud-acciones">
                    <button class="btn-ver" onclick="event.stopPropagation(); verDetalleSolicitud(${s.id})">Ver detalles</button>
                </div>
            </div>
        </div>
    `;
}

// ===== VER DETALLE DE SOLICITUD =====
function verDetalleSolicitud(id) {
    const solicitud = solicitudesData.find(s => s.id === id);
    if (!solicitud) return;
    
    const detalle = document.getElementById('solicitudDetalle');
    const acciones = document.getElementById('solicitudAcciones');
    const observacionesGroup = document.getElementById('observacionesGroup');
    
    if (!detalle) return;
    
    // Construir detalle
    detalle.innerHTML = `
        <div class="detalle-seccion">
            <h3>Información del Cliente</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="label">Nombre</span>
                    <span class="value">${solicitud.cliente_nombre || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Email</span>
                    <span class="value">${solicitud.cliente_email || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Teléfono</span>
                    <span class="value">${solicitud.cliente_telefono || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="detalle-seccion">
            <h3>Servicio Solicitado</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="label">Nombre</span>
                    <span class="value">${solicitud.nombre_servicio}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Categoría</span>
                    <span class="value">${solicitud.categoria_nombre || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Subcategoría</span>
                    <span class="value">${solicitud.subcategoria_nombre || 'Nueva: ' + (solicitud.nueva_subcategoria || 'N/A')}</span>
                </div>
                <div class="detalle-item full-width">
                    <span class="label">Descripción</span>
                    <span class="value">${solicitud.descripcion || 'Sin descripción'}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Precio</span>
                    <span class="value">$${Number(solicitud.precio_propuesto).toLocaleString('es-MX')} ${solicitud.moneda}</span>
                </div>
            </div>
        </div>
        
        <div class="detalle-seccion">
            <h3>Proveedor</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="label">Negocio</span>
                    <span class="value">${solicitud.proveedor_nombre}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Email</span>
                    <span class="value">${solicitud.proveedor_email}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Teléfono</span>
                    <span class="value">${solicitud.proveedor_telefono || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">WhatsApp</span>
                    <span class="value">${solicitud.proveedor_whatsapp || 'N/A'}</span>
                </div>
                <div class="detalle-item full-width">
                    <span class="label">Dirección</span>
                    <span class="value">${solicitud.proveedor_direccion || 'N/A'}</span>
                </div>
                <div class="detalle-item">
                    <span class="label">Sitio web</span>
                    <span class="value">${solicitud.sitio_web || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="detalle-seccion">
            <h3>Información adicional</h3>
            <div class="detalle-grid">
                <div class="detalle-item full-width">
                    <span class="label">Comentarios</span>
                    <span class="value">${solicitud.comentarios || 'Sin comentarios'}</span>
                </div>
                <div class="detalle-item full-width">
                    <span class="label">Imágenes</span>
                    <span class="value">${solicitud.imagenes || 'No proporcionadas'}</span>
                </div>
            </div>
        </div>
        
        <div class="detalle-seccion">
            <h3>Estado de la solicitud</h3>
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="label">Estado actual</span>
                    <span class="value"><span class="solicitud-estado estado-${solicitud.estado}">${solicitud.estado}</span></span>
                </div>
                <div class="detalle-item">
                    <span class="label">Fecha solicitud</span>
                    <span class="value">${new Date(solicitud.fecha_solicitud).toLocaleString()}</span>
                </div>
                ${solicitud.fecha_atencion ? `
                <div class="detalle-item">
                    <span class="label">Fecha atención</span>
                    <span class="value">${new Date(solicitud.fecha_atencion).toLocaleString()}</span>
                </div>
                ` : ''}
                ${solicitud.observaciones_admin ? `
                <div class="detalle-item full-width">
                    <span class="label">Observaciones admin</span>
                    <span class="value">${solicitud.observaciones_admin}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Configurar acciones según estado
    if (acciones && observacionesGroup) {
        if (solicitud.estado === 'pendiente') {
            acciones.innerHTML = `
                <button class="btn-aprobar" onclick="prepararAprobar(${solicitud.id})">✅ Aprobar solicitud</button>
                <button class="btn-rechazar" onclick="prepararRechazar(${solicitud.id})">❌ Rechazar solicitud</button>
            `;
            observacionesGroup.style.display = 'block';
        } else {
            acciones.innerHTML = '';
            observacionesGroup.style.display = 'none';
        }
    }
    
    const observacionesModal = document.getElementById('observacionesModal');
    if (observacionesModal) {
        observacionesModal.value = '';
    }
    
    const modal = document.getElementById('modalSolicitud');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// ===== PREPARAR APROBAR =====
function prepararAprobar(id) {
    solicitudIdAccion = id;
    accionActual = 'aprobar';
    const modalTitulo = document.getElementById('modalTitulo');
    if (modalTitulo) modalTitulo.textContent = 'Aprobar Solicitud';
    
    const observacionesGroup = document.getElementById('observacionesGroup');
    if (observacionesGroup) observacionesGroup.style.display = 'block';
}

function prepararRechazar(id) {
    solicitudIdAccion = id;
    accionActual = 'rechazar';
    const modalTitulo = document.getElementById('modalTitulo');
    if (modalTitulo) modalTitulo.textContent = 'Rechazar Solicitud';
    
    const observacionesGroup = document.getElementById('observacionesGroup');
    if (observacionesGroup) observacionesGroup.style.display = 'block';
}

// ===== CONFIRMAR ACCIÓN =====
async function confirmarAccion() {
    if (!solicitudIdAccion || !accionActual) return;
    
    const observacionesModal = document.getElementById('observacionesModal');
    const observaciones = observacionesModal ? observacionesModal.value : '';
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/solicitudes-registro/${solicitudIdAccion}/${accionActual}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ observaciones })
        });
        
        if (response.ok) {
            mostrarToast(`Solicitud ${accionActual === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`, 'success');
            cerrarModalSolicitud();
            cargarSolicitudes();
        } else {
            const error = await response.json();
            mostrarToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al procesar solicitud', 'error');
    }
}

// ===== CERRAR MODAL =====
function cerrarModalSolicitud() {
    const modal = document.getElementById('modalSolicitud');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    solicitudIdAccion = null;
    accionActual = null;
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

// ===== TOGGLE MENÚ =====
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (menu) menu.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Solicitudes iniciado');
    checkAdminAuth();
    cargarSolicitudes();
    
    // Tabs
    document.querySelectorAll('.solicitud-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filtrarSolicitudes(tab.dataset.estado);
        });
    });
    
    // Cerrar modal
    const closeModal = document.getElementById('closeModalSolicitud');
    if (closeModal) {
        closeModal.addEventListener('click', cerrarModalSolicitud);
    }
    
    // Botón confirmar
    const btnConfirmar = document.getElementById('btnConfirmarAccion');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarAccion);
    }
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modalSolicitud');
        if (e.target === modal) {
            cerrarModalSolicitud();
        }
    });
});

// Exponer funciones globales
window.verDetalleSolicitud = verDetalleSolicitud;
window.prepararAprobar = prepararAprobar;
window.prepararRechazar = prepararRechazar;
window.cerrarModalSolicitud = cerrarModalSolicitud;
window.toggleMenu = toggleMenu;