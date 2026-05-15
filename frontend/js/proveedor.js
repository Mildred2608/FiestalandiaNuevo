// frontend/js/proveedor.js
//const API_URL = 'http://localhost:3000/api';

// ===== VERIFICAR SESIÓN DE PROVEEDOR =====
function checkProveedorAuth() {
    const user = auth.getCurrentUser();
    if (!user || !auth.hasRole('proveedor')) {
        window.location.href = 'index.html';
    } else {
        const proveedorBtn = document.getElementById('proveedorLoginBtn');
        if (proveedorBtn) {
            proveedorBtn.innerHTML = `👤 ${user.nombre}`;
            proveedorBtn.classList.add('logged-in');
        }
        // Cargar datos iniciales
        cargarServiciosProveedor();
    }
}

// ===== FUNCIONES DEL MENÚ PROVEEDOR =====
function initProveedorMenu() {
    const loginBtn = document.getElementById('proveedorLoginBtn');
    if (loginBtn) {
        loginBtn.onclick = (e) => {
            e.preventDefault();
            const user = auth.getCurrentUser();
            if (user) {
                mostrarMenuProveedor(user);
            }
        };
    }
}

function mostrarMenuProveedor(user) {
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) existingMenu.remove();

    const menuContent = `
        <div class="user-menu-header">
            <strong>${escapeHtml(user.nombre)}</strong>
            <small>${escapeHtml(user.email)}</small>
        </div>
        <div class="user-menu-items">
            <a href="perfil.html">👤 Mi Perfil</a>
            <a href="proveedor.html">🏢 Panel Proveedor</a>
            <a href="mis-cotizaciones.html">💰 Mis Cotizaciones</a>
            <a href="mis-eventos.html">📅 Mis Eventos</a>
            <hr>
            <a href="#" onclick="proveedorLogout()" style="color: #dc3545;">🚪 Cerrar Sesión</a>
        </div>
    `;

    const userMenu = document.createElement('div');
    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu';
    userMenu.innerHTML = menuContent;
    document.body.appendChild(userMenu);

    const loginBtn = document.getElementById('proveedorLoginBtn');
    const rect = loginBtn.getBoundingClientRect();
    userMenu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    userMenu.style.left = (rect.left + window.scrollX - 150) + 'px';
    userMenu.style.display = 'block';

    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu(e) {
            if (!userMenu.contains(e.target) && e.target !== loginBtn) {
                userMenu.style.display = 'none';
                document.removeEventListener('click', cerrarMenu);
            }
        });
    }, 100);
}

function proveedorLogout() {
    auth.logout();
    window.location.href = 'index.html';
}

// ===== FUNCIONES PARA CARGAR DATOS =====
async function cargarServiciosProveedor() {
    try {
        const user = auth.getCurrentUser();
        const response = await fetch(`${API_URL}/servicios/proveedor/${user.id}`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar servicios');

        const servicios = await response.json();
        mostrarServiciosProveedor(servicios);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar servicios');
    }
}

function mostrarServiciosProveedor(servicios) {
    const tbody = document.getElementById('serviciosTableBody');
    if (!tbody) return;

    if (servicios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No tienes servicios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = servicios.map(servicio => `
        <tr>
            <td>${servicio.id}</td>
            <td>${escapeHtml(servicio.nombre)}</td>
            <td>${escapeHtml(servicio.categoria_nombre || 'N/A')}</td>
            <td>${escapeHtml(servicio.subcategoria_nombre || 'N/A')}</td>
            <td>$${servicio.precio_base}</td>
            <td><span class="status-${servicio.estado}">${servicio.estado}</span></td>
            <td>
                <button class="btn-edit" onclick="editarServicio(${servicio.id})">✏️</button>
                <button class="btn-delete" onclick="eliminarServicio(${servicio.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function cargarCotizacionesProveedor() {
    try {
        const user = auth.getCurrentUser();
        const response = await fetch(`${API_URL}/cotizaciones/proveedor/${user.id}`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar cotizaciones');

        const cotizaciones = await response.json();
        mostrarCotizacionesProveedor(cotizaciones);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar cotizaciones');
    }
}

function mostrarCotizacionesProveedor(cotizaciones) {
    const tbody = document.getElementById('cotizacionesTableBody');
    if (!tbody) return;

    if (cotizaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No tienes cotizaciones enviadas</td></tr>';
        return;
    }

    tbody.innerHTML = cotizaciones.map(cot => `
        <tr>
            <td>${cot.id}</td>
            <td>${escapeHtml(cot.cliente_nombre)}</td>
            <td>${escapeHtml(cot.servicio_nombre)}</td>
            <td>$${cot.precio}</td>
            <td><span class="status-${cot.estado}">${cot.estado}</span></td>
            <td>${new Date(cot.fecha_creacion).toLocaleDateString()}</td>
            <td>
                <button class="btn-view" onclick="verCotizacion(${cot.id})">👁️</button>
            </td>
        </tr>
    `).join('');
}

async function cargarSolicitudesProveedor() {
    try {
        const response = await fetch(`${API_URL}/solicitudes/disponibles`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar solicitudes');

        const solicitudes = await response.json();
        mostrarSolicitudesProveedor(solicitudes);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar solicitudes');
    }
}

function mostrarSolicitudesProveedor(solicitudes) {
    const tbody = document.getElementById('solicitudesTableBody');
    if (!tbody) return;

    if (solicitudes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No hay solicitudes disponibles</td></tr>';
        return;
    }

    tbody.innerHTML = solicitudes.map(sol => `
        <tr>
            <td>${sol.id}</td>
            <td>${escapeHtml(sol.cliente_nombre)}</td>
            <td>${escapeHtml(sol.servicio_solicitado)}</td>
            <td>${escapeHtml(sol.detalles || 'Sin detalles')}</td>
            <td>${new Date(sol.fecha_creacion).toLocaleDateString()}</td>
            <td><span class="status-${sol.estado}">${sol.estado}</span></td>
            <td>
                <button class="btn-primary" onclick="enviarCotizacion(${sol.id})">💰 Cotizar</button>
            </td>
        </tr>
    `).join('');
}

// ===== FUNCIONES DE GESTIÓN =====
async function registrarNuevoServicio() {
    const form = document.getElementById('formNuevoServicio');
    const formData = new FormData(form);

    const servicioData = {
        nombre: formData.get('servicioNombre'),
        categoria_id: formData.get('servicioCategoria'),
        subcategoria_id: formData.get('servicioSubcategoria'),
        precio_base: parseFloat(formData.get('servicioPrecio')),
        descripcion: formData.get('servicioDescripcion'),
        proveedor_id: auth.getCurrentUser().id
    };

    try {
        const response = await fetch(`${API_URL}/servicios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify(servicioData)
        });

        if (!response.ok) throw new Error('Error al registrar servicio');

        alert('Servicio registrado exitosamente');
        cerrarModal('modalNuevoServicio');
        form.reset();
        cargarServiciosProveedor();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al registrar servicio: ' + error.message);
    }
}

function enviarCotizacion(solicitudId) {
    document.getElementById('solicitudId').value = solicitudId;
    abrirModal('modalCotizacion');
}

async function enviarCotizacionSubmit() {
    const form = document.getElementById('formCotizacion');
    const formData = new FormData(form);

    const cotizacionData = {
        solicitud_id: parseInt(formData.get('solicitudId')),
        precio: parseFloat(formData.get('cotizacionPrecio')),
        mensaje: formData.get('cotizacionMensaje'),
        proveedor_id: auth.getCurrentUser().id
    };

    try {
        const response = await fetch(`${API_URL}/cotizaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify(cotizacionData)
        });

        if (!response.ok) throw new Error('Error al enviar cotización');

        alert('Cotización enviada exitosamente');
        cerrarModal('modalCotizacion');
        form.reset();
        cargarSolicitudesProveedor();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar cotización: ' + error.message);
    }
}

// ===== FUNCIONES DE UI =====
function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const panels = document.querySelectorAll('.admin-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover active de todos
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Agregar active al seleccionado
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Cargar datos según el tab
            if (tabId === 'cotizaciones') {
                cargarCotizacionesProveedor();
            } else if (tabId === 'solicitudes') {
                cargarSolicitudesProveedor();
            }
        });
    });
}

function initModals() {
    // Modal nuevo servicio
    const btnNuevoServicio = document.getElementById('btnNuevoServicio');
    if (btnNuevoServicio) {
        btnNuevoServicio.addEventListener('click', () => {
            cargarCategoriasParaServicio();
            abrirModal('modalNuevoServicio');
        });
    }

    const formNuevoServicio = document.getElementById('formNuevoServicio');
    if (formNuevoServicio) {
        formNuevoServicio.addEventListener('submit', (e) => {
            e.preventDefault();
            registrarNuevoServicio();
        });
    }

    const formCotizacion = document.getElementById('formCotizacion');
    if (formCotizacion) {
        formCotizacion.addEventListener('submit', (e) => {
            e.preventDefault();
            enviarCotizacionSubmit();
        });
    }
}

async function cargarCategoriasParaServicio() {
    try {
        const response = await fetch(`${API_URL}/categorias`);
        const categorias = await response.json();

        const selectCategoria = document.getElementById('servicioCategoria');
        selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';

        categorias.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });

        // Event listener para cargar subcategorías
        selectCategoria.addEventListener('change', cargarSubcategoriasParaServicio);
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function cargarSubcategoriasParaServicio() {
    const categoriaId = document.getElementById('servicioCategoria').value;
    if (!categoriaId) return;

    try {
        const response = await fetch(`${API_URL}/subcategorias/categoria/${categoriaId}`);
        const subcategorias = await response.json();

        const selectSubcategoria = document.getElementById('servicioSubcategoria');
        selectSubcategoria.innerHTML = '<option value="">Seleccionar subcategoría</option>';

        subcategorias.forEach(sub => {
            selectSubcategoria.innerHTML += `<option value="${sub.id}">${sub.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error cargando subcategorías:', error);
    }
}

// ===== UTILIDADES =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarError(mensaje) {
    // Implementar notificación de error
    alert(mensaje);
}

function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    checkProveedorAuth();
    initProveedorMenu();
    initTabs();
    initModals();
});