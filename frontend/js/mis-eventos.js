// frontend/js/mis-eventos.js
//const API_URL = 'http://localhost:3000/api';

let eventoAEliminar = null;

// ===== VERIFICAR AUTENTICACIÓN =====
function checkAuth() {
    const user = auth.getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
    }
    return user;
}

// ===== CARGAR TIPOS DE EVENTO =====
async function cargarTiposEvento(tipoSeleccionado = '') {
    const tiposPorDefecto = [
        { id: '1', nombre: 'Boda' },
        { id: '2', nombre: 'Cumpleaños' },
        { id: '3', nombre: 'Bautizo' },
        { id: '4', nombre: 'Comunión' },
        { id: '5', nombre: 'Aniversario' },
        { id: '6', nombre: 'Fiesta infantil' },
        { id: '7', nombre: 'Conferencia' },
        { id: '8', nombre: 'Team building' },
        { id: '9', nombre: 'Graduación' },
        { id: '10', nombre: 'Celebración corporativa' }
    ];
    
    const select = document.getElementById('eventoTipo');
    select.innerHTML = '<option value="">Seleccionar...</option>';

    try {
        const response = await fetch(`${API_URL}/tipos-evento`);
        let tiposApi = [];

        if (response.ok) {
            tiposApi = await response.json();
        } else {
            console.warn('No se pudo obtener tipos desde API, usando valores por defecto.');
        }

        const tiposUnicos = [...tiposPorDefecto];
        tiposApi.forEach(apiTipo => {
            const existe = tiposUnicos.some(t => String(t.id) === String(apiTipo.id) || t.nombre.toLowerCase() === (apiTipo.nombre || '').toLowerCase());
            if (!existe) {
                tiposUnicos.push({ id: apiTipo.id, nombre: apiTipo.nombre });
            }
        });

        tiposUnicos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nombre;
            select.appendChild(option);
        });

        if (tipoSeleccionado) {
            select.value = tipoSeleccionado;
        }

    } catch (error) {
        console.error('Error al cargar tipos de evento:', error);
        // En caso de error de red, mostrar los tipos por defecto
        tiposPorDefecto.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id;
            option.textContent = tipo.nombre;
            select.appendChild(option);
        });
    }
}

// ===== CARGAR EVENTOS DEL CLIENTE =====
async function cargarEventos() {
    const grid = document.getElementById('eventosGrid');
    const user = checkAuth();
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/cliente/eventos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const eventos = await response.json();
        
        if (eventos.length === 0) {
            grid.innerHTML = `
                <div class="no-eventos">
                    <p>No tienes eventos creados aún</p>
                    <p>Usa el botón "+ Nuevo Evento" en la parte superior para crear uno.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = eventos.map(evento => `
            <div class="evento-card">
                <div class="evento-header">
                    <h3 class="evento-nombre">${evento.nombre_evento}</h3>
                    <span class="evento-estado estado-${evento.estado || 'planificando'}">
                        ${evento.estado || 'Planificando'}
                    </span>
                </div>
                
                <div class="evento-detalle">
                    <div class="detalle-item">
                        <i>📅</i> ${new Date(evento.fecha).toLocaleDateString()}
                    </div>
                    <div class="detalle-item">
                        <i>👥</i> ${evento.invitados || 0} invitados
                    </div>
                    ${evento.ubicacion ? `
                    <div class="detalle-item">
                        <i>📍</i> ${evento.ubicacion}
                    </div>
                    ` : ''}
                </div>
                
                <div class="evento-acciones">
                    <button class="btn-accion btn-ver" onclick="verEvento(${evento.id})">👁️ Ver</button>
                    <button class="btn-accion btn-editar" onclick="editarEvento(${evento.id})">✏️ Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="confirmarEliminar(${evento.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        grid.innerHTML = '<div class="no-eventos">Error al cargar eventos</div>';
    }
}

// ===== ABRIR MODAL NUEVO EVENTO =====
async function abrirModalNuevoEvento() {
    document.getElementById('modalTitulo').textContent = 'Nuevo Evento';
    document.getElementById('eventoId').value = '';
    document.getElementById('formEvento').reset();
    
    await cargarTiposEvento();
    
    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('eventoFecha').min = hoy;
    
    document.getElementById('modalEvento').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ===== GUARDAR EVENTO =====
async function guardarEvento(event) {
    event.preventDefault();
    
    const eventoId = document.getElementById('eventoId').value;
    const eventoData = {
        nombre_evento: document.getElementById('eventoNombre').value,
        tipo_id: document.getElementById('eventoTipo').value,
        fecha: document.getElementById('eventoFecha').value,
        invitados: document.getElementById('eventoInvitados').value || 0,
        ubicacion: document.getElementById('eventoUbicacion').value,
        mensaje: document.getElementById('eventoMensaje').value
    };
    
    const token = localStorage.getItem('token');
    const url = eventoId 
        ? `${API_URL}/admin/cliente/eventos/${eventoId}`
        : `${API_URL}/admin/cliente/eventos`;
    const method = eventoId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventoData)
        });
        
        if (response.ok) {
            cerrarModalEvento();
            cargarEventos();
            mostrarToast(eventoId ? 'Evento actualizado' : 'Evento creado', 'success');
        } else {
            const error = await response.json();
            mostrarToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al guardar evento', 'error');
    }
}

// ===== VER EVENTO =====
function verEvento(id) {
    window.location.href = `carrito.html?eventoId=${id}`;
}

// ===== EDITAR EVENTO =====
async function editarEvento(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/cliente/eventos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const evento = await response.json();
        
        document.getElementById('modalTitulo').textContent = 'Editar Evento';
        document.getElementById('eventoId').value = evento.id;
        document.getElementById('eventoNombre').value = evento.nombre_evento;
        document.getElementById('eventoFecha').value = new Date(evento.fecha).toISOString().split('T')[0];
        document.getElementById('eventoInvitados').value = evento.invitados || '';
        document.getElementById('eventoUbicacion').value = evento.ubicacion || '';
        document.getElementById('eventoMensaje').value = evento.mensaje || '';

        await cargarTiposEvento(evento.tipo_id);
        document.getElementById('modalEvento').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al cargar evento', 'error');
    }
}

// ===== CONFIRMAR ELIMINAR =====
function confirmarEliminar(id) {
    eventoAEliminar = id;
    document.getElementById('modalConfirmar').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ===== ELIMINAR EVENTO =====
async function eliminarEvento() {
    if (!eventoAEliminar) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/admin/cliente/eventos/${eventoAEliminar}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            cerrarModalConfirmar();
            cargarEventos();
            mostrarToast('Evento eliminado', 'success');
        } else {
            const error = await response.json();
            mostrarToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al eliminar evento', 'error');
    }
    
    eventoAEliminar = null;
}

// ===== CERRAR MODALES =====
function cerrarModalEvento() {
    document.getElementById('modalEvento').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function cerrarModalConfirmar() {
    document.getElementById('modalConfirmar').style.display = 'none';
    document.body.style.overflow = 'auto';
    eventoAEliminar = null;
}

// ===== TOAST =====
function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast', tipo);
    
    let icono = '📌';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    
    toast.innerHTML = `<span class="toast-icon">${icono}</span>${mensaje}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2800);
}

// ===== ACTUALIZAR BADGE DEL CARRITO =====
function actualizarBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    try {
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
        badge.textContent = total;
        badge.style.display = total > 0 ? 'inline-block' : 'none';
    } catch (e) {
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
    console.log('Mis Eventos iniciado');
    actualizarBotonLogin();
    cargarEventos();
    actualizarBadge();
    
    // Configurar modales
    document.getElementById('closeModalEvento').addEventListener('click', cerrarModalEvento);
    document.getElementById('closeModalConfirmar').addEventListener('click', cerrarModalConfirmar);
    document.getElementById('btnConfirmarEliminar').addEventListener('click', eliminarEvento);
    document.getElementById('formEvento').addEventListener('submit', guardarEvento);
    
    // Cerrar modales al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalEvento')) cerrarModalEvento();
        if (e.target === document.getElementById('modalConfirmar')) cerrarModalConfirmar();
    });
});

// Exponer funciones globales
window.abrirModalNuevoEvento = abrirModalNuevoEvento;
window.verEvento = verEvento;
window.editarEvento = editarEvento;
window.confirmarEliminar = confirmarEliminar;
window.toggleMenu = toggleMenu;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;