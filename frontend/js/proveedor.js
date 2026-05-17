// frontend/js/proveedor.js - CÓDIGO COMPLETO E INTEGRADO
// const API_URL = 'http://localhost:3000/api';

// ===== FUNCIONES DE AUTENTICACIÓN =====

// Verificar acceso al panel proveedor
function checkProveedorAuth() {

    const user = auth.getCurrentUser();
    const token = localStorage.getItem('token');

    // Validar sesión
    if (!user || !token) {
        window.location.href = 'index.html';
        return;
    }

    // Obtener roles correctamente
    const roles = Array.isArray(user.roles)
        ? user.roles
        : [user.rol].filter(Boolean);

    // Verificar permisos
    if (!roles.includes('proveedor')) {
        mostrarToast('No tienes permisos para acceder al panel proveedor', 'error');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);

        return;
    }

    actualizarBotonProveedor(user);

    // Carga inicial obligatoria
    cargarServiciosProveedor();
}

// ===== ACTUALIZAR BOTÓN LOGIN =====
function actualizarBotonProveedor(user) {

    const proveedorBtn =
        document.getElementById('proveedorLoginBtn');

    if (!proveedorBtn) return;

    proveedorBtn.innerHTML = `👤 ${escapeHtml(user.nombre)}`;

    proveedorBtn.classList.add('logged-in');

    proveedorBtn.onclick = (e) => {
        e.preventDefault();

        mostrarMenuProveedor(user);
    };
}

// ===== MENÚ DESPLEGABLE =====
function initProveedorMenu() {

    const loginBtn =
        document.getElementById('proveedorLoginBtn');

    if (!loginBtn) return;

    loginBtn.addEventListener('click', (e) => {

        e.preventDefault();

        const user = auth.getCurrentUser();

        if (user) {
            mostrarMenuProveedor(user);
        }
    });
}

// ===== MOSTRAR MENÚ =====
function mostrarMenuProveedor(user) {

    // Eliminar menú existente
    const existingMenu =
        document.getElementById('userMenu');

    if (existingMenu) {
        existingMenu.remove();
    }

    // Roles seguros
    const roles = Array.isArray(user.roles)
        ? user.roles
        : [user.rol].filter(Boolean);

    // ===== CONTENIDO DEL MENÚ =====
    let menuContent = `

        <div class="user-menu-header">

            <strong>${escapeHtml(user.nombre)}</strong>

            <small>${escapeHtml(user.email)}</small>

        </div>

        <div class="user-menu-items">

            <a href="perfil.html">
                👤 Mi Perfil
            </a>

            <a href="mis-eventos.html">
                📅 Mis Eventos
            </a>

            <a href="mis-cotizaciones.html">
                💰 Mis Cotizaciones
            </a>
    `;

    // ===== SECCIÓN PROVEEDOR =====
    if (roles.includes('proveedor')) {

        menuContent += `

            <hr class="menu-divider">

            <div class="menu-section-title">
                💼 PANEL PROVEEDOR
            </div>

            <a href="proveedor.html"
               class="menu-proveedor">

               🏢 Panel Proveedor

            </a>

            <a href="mis-solicitudes-servicio.html">

                📦 Mis Servicios

            </a>
        `;
    }

    // ===== SECCIÓN ADMIN =====
    if (roles.includes('admin')) {

        menuContent += `

            <hr class="menu-divider">

            <div class="menu-section-title">
                👑 ADMINISTRACIÓN
            </div>

            <a href="admin.html">

                👑 Panel Admin

            </a>
        `;
    }

    // ===== CERRAR SESIÓN =====
    menuContent += `

            <hr class="menu-divider">

            <a href="#"
               onclick="proveedorLogout()"
               class="btn-logout"
               style="
                    color:#dc3545;
                    font-weight:600;
                    text-align:center;
                    margin-top:8px;
                    border-radius:8px;
                    display:block;
               ">

               🚪 Cerrar Sesión

            </a>

        </div>
    `;

    // ===== CREAR MENÚ =====
    const userMenu = document.createElement('div');

    userMenu.id = 'userMenu';

    userMenu.className = 'user-menu';

    userMenu.innerHTML = menuContent;

    document.body.appendChild(userMenu);

    // ===== POSICIÓN =====
    const loginBtn =
        document.getElementById('proveedorLoginBtn');

    const rect =
        loginBtn.getBoundingClientRect();

    userMenu.style.position = 'absolute';

    userMenu.style.top =
        (rect.bottom + window.scrollY + 8) + 'px';

    userMenu.style.left =
        (rect.left + window.scrollX - 80) + 'px';

    userMenu.style.display = 'block';

    userMenu.style.zIndex = '9999';

    // ===== CERRAR AL HACER CLICK FUERA =====
    setTimeout(() => {

        document.addEventListener(
            'click',
            function cerrarMenu(e) {

                if (
                    !userMenu.contains(e.target) &&
                    e.target !== loginBtn
                ) {

                    userMenu.remove();

                    document.removeEventListener(
                        'click',
                        cerrarMenu
                    );
                }
            }
        );

    }, 100);
}

// ===== CERRAR SESIÓN =====
function proveedorLogout() {

    auth.logout();

    localStorage.removeItem('token');

    mostrarToast(
        'Sesión cerrada correctamente',
        'success'
    );

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 700);
}
// ===== PESTAÑA 1: CARGAR Y MOSTRAR SERVICIOS =====
async function cargarServiciosProveedor() {
    const tbody = document.getElementById('serviciosTableBody');
    if (!tbody) return;

    try {
        const user = auth.getCurrentUser();
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/proveedor/servicios/proveedor/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar servicios');
        
        const servicios = await response.json();
        mostrarServiciosProveedor(servicios);
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="error" style="box-shadow: none; padding: 20px;">
                        ⚠️ Error al sincronizar los servicios con el servidor.
                    </div>
                </td>
            </tr>`;
    }
}

function mostrarServiciosProveedor(servicios) {
    const tbody = document.getElementById('serviciosTableBody');
    if (!tbody) return;

    if (!servicios || servicios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-cotizaciones" style="box-shadow: none; padding: 30px;">No tienes servicios registrados actualmente.</td></tr>';
        return;
    }

    tbody.innerHTML = servicios.map(servicio => `
        <tr>
            <td><strong>#${servicio.id}</strong></td>
            <td>${escapeHtml(servicio.nombre)}</td>
            <td><span class="cotizacion-estado estado-enviada" style="text-transform: none; font-size: 0.85rem;">${escapeHtml(servicio.categoria_nombre || 'N/A')}</span></td>
            <td>${escapeHtml(servicio.subcategoria_nombre || 'N/A')}</td>
            <td style="font-weight: 700; color: #7c3aed;">$${servicio.precio_base}</td>
            <td><span class="cotizacion-estado estado-${servicio.estado === 'activo' ? 'aceptada' : 'rechazada'}">${servicio.estado || 'activo'}</span></td>
            <td>
                <div class="card-buttons" style="gap: 6px;">
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="prepararEditarServicio(${servicio.id}, '${escapeHtml(servicio.nombre)}', ${servicio.categoria_id}, ${servicio.subcategoria_id}, ${servicio.precio_base}, '${escapeHtml(servicio.descripcion || '')}')" title="Editar">✏️ Editar</button>
                    <button class="btn btn-primary" style="background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 6px 12px; font-size: 0.8rem;" onclick="eliminarServicio(${servicio.id})" title="Eliminar">🗑️ Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== PESTAÑA 2: CARGAR Y MOSTRAR COTIZACIONES =====
async function cargarCotizacionesProveedor() {
    const tbody = document.getElementById('cotizacionesTableBody');
    if (!tbody) return;

    try {
        const user = auth.getCurrentUser();
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/proveedor/cotizaciones/proveedor/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar cotizaciones');
        
        const cotizaciones = await response.json();
        mostrarCotizacionesProveedor(cotizaciones);
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="error" style="box-shadow: none; padding: 20px;">
                        ⚠️ Error al sincronizar las cotizaciones.
                    </div>
                </td>
            </tr>`;
    }
}

function mostrarCotizacionesProveedor(cotizaciones) {
    const tbody = document.getElementById('cotizacionesTableBody');
    if (!tbody) return;

    if (!cotizaciones || cotizaciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-cotizaciones" style="box-shadow: none; padding: 30px;">No tienes cotizaciones enviadas.</td></tr>';
        return;
    }

    tbody.innerHTML = cotizaciones.map(cot => {
        const estadoClase = cot.estado.toLowerCase();
        return `
            <tr>
                <td><strong>#${cot.id}</strong></td>
                <td>${escapeHtml(cot.cliente_nombre)}</td>
                <td>${escapeHtml(cot.servicio_nombre)}</td>
                <td style="font-weight: 700; color: #ec4899;">$${cot.precio}</td>
                <td><span class="cotizacion-estado estado-${estadoClase}">${cot.estado}</span></td>
                <td>${new Date(cot.fecha_creacion || cot.creado_en).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary" style="padding: 6px 14px;" onclick="mostrarToast('Detalle Cotización #' + ${cot.id}, 'info')">👁️ Ver</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== PESTAÑA 3: CARGAR Y MOSTRAR SOLICITUDES DEL MERCADO =====
async function cargarSolicitudesProveedor() {
    const tbody = document.getElementById('solicitudesTableBody');
    if (!tbody) return;

    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/proveedor/solicitudes/disponibles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar solicitudes');
        
        const solicitudes = await response.json();
        mostrarSolicitudesProveedor(solicitudes);
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="error" style="box-shadow: none; padding: 20px;">
                        ⚠️ Error al sincronizar las solicitudes de mercado.
                    </div>
                </td>
            </tr>`;
    }
}

function mostrarSolicitudesProveedor(solicitudes) {
    const tbody = document.getElementById('solicitudesTableBody');
    if (!tbody) return;

    if (!solicitudes || solicitudes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-cotizaciones" style="box-shadow: none; padding: 30px;">No hay solicitudes disponibles en este momento.</td></tr>';
        return;
    }

    tbody.innerHTML = solicitudes.map(sol => `
        <tr>
            <td><strong>#${sol.id}</strong></td>
            <td>${escapeHtml(sol.cliente_nombre)}</td>
            <td>${escapeHtml(sol.servicio_solicitado)}</td>
            <td><small style="color: #6b7280; font-size: 0.85rem;">${escapeHtml(sol.detalles || 'Sin detalles adicionales')}</small></td>
            <td>${new Date(sol.fecha_creacion || sol.fecha_solicitud).toLocaleDateString()}</td>
            <td><span class="cotizacion-estado estado-pendiente">${sol.estado}</span></td>
            <td>
                <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="enviarCotizacion(${sol.id})">💰 Cotizar</button>
            </td>
        </tr>
    `).join('');
}

// ===== ACCIÓN: REGISTRAR / ACTUALIZAR SERVICIO (POST / PUT) =====
async function registrarNuevoServicio() {
    const form = document.getElementById('formNuevoServicio');
    const formData = new FormData(form);
    const token = localStorage.getItem('token');
    const servicioId = document.getElementById('servicioIdHidden')?.value;

    const servicioData = {
        nombre: formData.get('servicioNombre'),
        categoria_id: parseInt(formData.get('servicioCategoria')),
        subcategoria_id: parseInt(formData.get('servicioSubcategoria')),
        precio_base: parseFloat(formData.get('servicioPrecio')),
        descripcion: formData.get('servicioDescripcion')
    };

    const esEdicion = (servicioId && servicioId !== "");
    const url = esEdicion ? `${API_URL}/proveedor/servicios/${servicioId}` : `${API_URL}/proveedor/servicios`;
    const metodo = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(servicioData)
        });

        if (!response.ok) throw new Error(esEdicion ? 'Error al actualizar el servicio' : 'Error al registrar servicio');
        
        mostrarToast(esEdicion ? '¡Servicio actualizado exitosamente! 🎉' : '¡Servicio registrado exitosamente! 🎉', 'success');
        cerrarModal('modalNuevoServicio');
        form.reset();
        
        if (document.getElementById('servicioIdHidden')) {
            document.getElementById('servicioIdHidden').value = "";
        }
        cargarServiciosProveedor();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error en la operación: ' + error.message, 'error');
    }
}

// ===== ACCIÓN: PREPARAR EL FORMULARIO EN MODO EDICIÓN =====
async function prepararEditarServicio(id, nombre, categoriaId, subcategoriaId, precio, descripcion) {
    let hiddenInput = document.getElementById('servicioIdHidden');
    if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'servicioIdHidden';
        document.getElementById('formNuevoServicio').appendChild(hiddenInput);
    }
    hiddenInput.value = id;

    document.getElementById('servicioNombre').value = nombre;
    document.getElementById('servicioPrecio').value = precio;
    document.getElementById('servicioDescripcion').value = descripcion;

    const modalTitle = document.querySelector('#modalNuevoServicio h3');
    if (modalTitle) modalTitle.textContent = '✏️ Editar Servicio';

    await cargarCategoriasParaServicio();
    document.getElementById('servicioCategoria').value = categoriaId;
    
    await cargarSubcategoriasParaServicio();
    document.getElementById('servicioSubcategoria').value = subcategoriaId;

    abrirModal('modalNuevoServicio');
}

// ===== ACCIÓN: ELIMINAR SERVICIO (DELETE) =====
async function eliminarServicio(id) {
    if (!confirm('¿Estás completamente seguro de que deseas eliminar este servicio? 🗑️')) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/proveedor/servicios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('No se pudo eliminar el servicio del servidor.');

        mostrarToast('Servicio eliminado correctamente.', 'success');
        cargarServiciosProveedor();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al eliminar el servicio: ' + error.message, 'error');
    }
}

// ===== ACCIÓN: ENVIAR NUEVA COTIZACIÓN A UNA SOLICITUD =====
function enviarCotizacion(solicitudId) {
    document.getElementById('solicitudId').value = solicitudId;
    abrirModal('modalCotizacion');
}

async function enviarCotizacionSubmit() {
    const form = document.getElementById('formCotizacion');
    const formData = new FormData(form);
    const token = localStorage.getItem('token');

    const cotizacionData = {
        solicitud_id: parseInt(formData.get('solicitudId')),
        precio: parseFloat(formData.get('cotizacionPrecio')),
        mensaje: formData.get('cotizacionMensaje')
    };

    try {
        const response = await fetch(`${API_URL}/proveedor/cotizaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cotizacionData)
        });

        if (!response.ok) throw new Error('Error al enviar cotización');
        
        mostrarToast('Cotización enviada exitosamente 💰', 'success');
        cerrarModal('modalCotizacion');
        form.reset();
        cargarSolicitudesProveedor();
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al enviar cotización: ' + error.message, 'error');
    }
}

// ===== SELECTORES ASÍNCRONOS DE CATEGORÍAS Y SUBCATEGORÍAS =====
async function cargarCategoriasParaServicio() {
    try {
        const response = await fetch(`${API_URL}/categorias`);
        const categorias = await response.json();
        const selectCategoria = document.getElementById('servicioCategoria');
        
        selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
        categorias.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });

        selectCategoria.removeEventListener('change', cargarSubcategoriasParaServicio);
        selectCategoria.addEventListener('change', cargarSubcategoriasParaServicio);
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function cargarSubcategoriasParaServicio() {
    const categoriaId = document.getElementById('servicioCategoria').value;
    const selectSubcategoria = document.getElementById('servicioSubcategoria');
    if (!categoriaId) {
        selectSubcategoria.innerHTML = '<option value="">Seleccionar subcategoría</option>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/subcategorias/categoria/${categoriaId}`);
        const subcategorias = await response.json();

        selectSubcategoria.innerHTML = '<option value="">Seleccionar subcategoría</option>';
        subcategorias.forEach(sub => {
            selectSubcategoria.innerHTML += `<option value="${sub.id}">${sub.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error cargando subcategorías:', error);
    }
}

// ===== CONTROLADORES DE INTERFAZ (TABS Y MODALES) =====
function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const panels = document.querySelectorAll('.admin-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            
            const targetPanel = document.getElementById(tabId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            if (tabId === 'servicios') cargarServiciosProveedor();
            if (tabId === 'cotizaciones') cargarCotizacionesProveedor();
            if (tabId === 'solicitudes') cargarSolicitudesProveedor();
        });
    });
}

function initModals() {
    const btnNuevoServicio = document.getElementById('btnNuevoServicio');
    if (btnNuevoServicio) {
        btnNuevoServicio.addEventListener('click', () => {
            if (document.getElementById('servicioIdHidden')) {
                document.getElementById('servicioIdHidden').value = "";
            }
            const form = document.getElementById('formNuevoServicio');
            if (form) form.reset();
            
            const modalTitle = document.querySelector('#modalNuevoServicio h3');
            if (modalTitle) modalTitle.textContent = '+ Registrar Nuevo Servicio';
            
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

// ===== NOTIFICACIONES TOAST =====
function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    let icono = 'ℹ️';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
        
    toast.innerHTML = `<span class="toast-icon">${icono}</span> ${mensaje}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3200);
}

// ===== UTILIDADES GLOBALES =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

// ===== CARGA INICIAL DE LA APP =====
document.addEventListener('DOMContentLoaded', () => {
    checkProveedorAuth();
    initProveedorMenu();
    initTabs();
    initModals();
});