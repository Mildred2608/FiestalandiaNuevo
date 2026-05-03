// frontend/js/admin.js
//const API_URL = 'http://localhost:3000/api';

// ===== VERIFICAR SESIÓN DE ADMIN =====
function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
    } else {
        const adminBtn = document.getElementById('adminLoginBtn');
        if (adminBtn) {
            adminBtn.innerHTML = `👤 ${user.nombre}`;
            adminBtn.classList.add('logged-in');
        }
    }
}

// ===== FUNCIONES DEL MENÚ ADMIN (ESTILO CLIENTE) =====
function initAdminMenu() {
    const loginBtn = document.getElementById('adminLoginBtn');
    if (loginBtn) {
        loginBtn.onclick = (e) => {
            e.preventDefault();
            const user = auth.getCurrentUser();
            if (user) {
                mostrarMenuAdmin(user);
            }
        };
    }
}

function mostrarMenuAdmin(user) {
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) existingMenu.remove();
    
    const menuContent = `
        <div class="user-menu-header">
            <strong>${escapeHtml(user.nombre)}</strong>
            <small>${escapeHtml(user.email)}</small>
        </div>
        <div class="user-menu-items">
            <a href="perfil.html">👤 Mi Perfil</a>
            <a href="admin-clientes.html">👥 Clientes</a>
            <a href="admin-proveedores.html">🏢 Proveedores</a>
            <a href="admin-cotizaciones.html">📊 Cotizaciones</a>
            <a href="admin-eventos.html">📅 Eventos</a>
            <a href="admin-solicitudes.html">📋 Solicitudes de Registro</a>
            <hr>
            <a href="#" onclick="adminLogout()" style="color: #dc3545;">🚪 Cerrar Sesión</a>
        </div>
    `;
    
    const userMenu = document.createElement('div');
    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu';
    userMenu.innerHTML = menuContent;
    document.body.appendChild(userMenu);
    
    const loginBtn = document.getElementById('adminLoginBtn');
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

// ===== FUNCIONES DEL MENÚ =====

// Funciones de gestión para admin
function verClientesAdmin() {
    window.location.href = 'admin-clientes.html';
}

function verProveedoresAdmin() {
    window.location.href = 'admin-proveedores.html';
}

function verCotizacionesGestionAdmin() {
    window.location.href = 'admin-cotizaciones.html';
}

function verEventosGestionAdmin() {
    window.location.href = 'admin-eventos.html';
}

function verSolicitudesRegistroAdmin() {
    console.log('Redirigiendo...');
    window.location.assign('admin-solicitudes.html');
}

function adminLogout() {
    auth.logout();
    window.location.href = 'index.html';
}

function cerrarMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) menu.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== TOGGLE MENU =====
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (menu) menu.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
}

// ===== TOAST =====
function showAdminToast(mensaje, tipo = 'info') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${tipo}`;
    const iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${iconos[tipo] || ''}</span> ${mensaje}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 400);
    }, 3000);
}

// ===== API CALL =====
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    const defaultHeaders = { 'Authorization': `Bearer ${token}` };

    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) }
    });

    return response;
}

// ===== TABS =====
function initTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');

            if (tab.dataset.tab === 'categorias') cargarCategorias();
            if (tab.dataset.tab === 'subcategorias') cargarSubcategorias();
            if (tab.dataset.tab === 'servicios') cargarServicios();
        });
    });
}

// ===== MODALES =====
function abrirModalAdmin(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModalAdmin(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== CATEGORÍAS =====
async function cargarCategorias() {
    const tbody = document.getElementById('tablaCategorias');
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row">⏳ Cargando categorías...</td><\/tr>';

    try {
        const response = await apiCall('/admin/categorias');
        if (!response.ok) throw new Error(`Error ${response.status}`);

        const categorias = await response.json();
        if (!categorias.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-row">📭 No hay categorías registradas</td><\/tr>';
            return;
        }

        tbody.innerHTML = categorias.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td><strong>${escapeHtml(cat.nombre)}</strong></td>
                <td>${escapeHtml(cat.descripcion) || '<em style="color:#9ca3af">Sin descripción</em>'}</td>
                <td>${new Date(cat.creado_en).toLocaleDateString('es-MX')}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarCategoria(${cat.id})">✏️ Editar</button>
                    <button class="action-btn delete-btn" onclick="eliminarCategoria(${cat.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading-row error-row">Error al cargar categorías</td><\/tr>';
    }
}

async function eliminarCategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
        const response = await apiCall(`/admin/categorias/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showAdminToast('Categoría eliminada', 'success');
            cargarCategorias();
        } else {
            const data = await response.json();
            showAdminToast(data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        showAdminToast('Error de conexión', 'error');
    }
}

async function editarCategoria(id) {
    try {
        const response = await apiCall(`/admin/categorias/${id}`);
        if (!response.ok) throw new Error();

        const categoria = await response.json();

        document.getElementById('editCategoriaId').value = categoria.id;
        document.getElementById('editCategoriaNombre').value = categoria.nombre;
        document.getElementById('editCategoriaDescripcion').value = categoria.descripcion || '';

        const preview = document.getElementById('editCategoriaImagenPreview');
        if (preview) {
            preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
            preview.classList.remove('has-image');
        }
        const removeBtn = document.getElementById('editCategoriaRemoveImg');
        if (removeBtn) removeBtn.style.display = 'none';

        abrirModalAdmin('modalEditarCategoria');
    } catch (error) {
        showAdminToast('Error al cargar la categoría', 'error');
    }
}

document.getElementById('formEditarCategoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editCategoriaId').value;
    const nombre = document.getElementById('editCategoriaNombre').value.trim();

    if (!nombre) {
        showAdminToast('El nombre es obligatorio', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', document.getElementById('editCategoriaDescripcion').value.trim());

    const fileInput = document.getElementById('editCategoriaImagenFile');
    if (fileInput.files.length > 0) formData.append('imagen', fileInput.files[0]);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const response = await apiCall(`/admin/categorias/${id}`, { method: 'PUT', body: formData });
        const data = await response.json();

        if (response.ok && data.success) {
            showAdminToast(' Categoría actualizada', 'success');
            cerrarModalAdmin('modalEditarCategoria');
            cargarCategorias();
        } else {
            showAdminToast(data.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        showAdminToast('Error de conexión', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
});

// ===== SUBCATEGORÍAS =====
async function cargarSubcategorias() {
    const tbody = document.getElementById('tablaSubcategorias');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row"> Cargando subcategorías...</td><\/tr>';

    try {
        const response = await apiCall('/admin/subcategorias');
        if (!response.ok) throw new Error();

        const subcategorias = await response.json();
        if (!subcategorias.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-row"> No hay subcategorías registradas</td><\/tr>';
            return;
        }

        tbody.innerHTML = subcategorias.map(sub => `
            <tr>
                <td>${sub.id}</td>
                <td><span class="category-badge">${escapeHtml(sub.categoria_nombre) || 'Sin categoría'}</span></td>
                <td><strong>${escapeHtml(sub.nombre)}</strong></td>
                <td>${escapeHtml(sub.descripcion) || '<em style="color:#9ca3af">Sin descripción</em>'}</td>
                <td>${new Date(sub.creado_en).toLocaleDateString('es-MX')}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarSubcategoria(${sub.id})">✏️ Editar</button>
                    <button class="action-btn delete-btn" onclick="eliminarSubcategoria(${sub.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-row error-row">Error al cargar subcategorías</td><\/tr>';
    }
}

async function eliminarSubcategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta subcategoría?')) return;
    try {
        const response = await apiCall(`/admin/subcategorias/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showAdminToast('Subcategoría eliminada', 'success');
            cargarSubcategorias();
        } else {
            const data = await response.json();
            showAdminToast(data.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        showAdminToast('Error de conexión', 'error');
    }
}

async function editarSubcategoria(id) {
    try {
        const response = await apiCall(`/admin/subcategorias/${id}`);
        if (!response.ok) throw new Error();

        const subcategoria = await response.json();

        document.getElementById('editSubcategoriaId').value = subcategoria.id;
        document.getElementById('editSubcategoriaNombre').value = subcategoria.nombre;
        document.getElementById('editSubcategoriaDescripcion').value = subcategoria.descripcion || '';

        const catSelect = document.getElementById('editSubcategoriaCategoriaId');
        if (catSelect) {
            const catResponse = await apiCall('/admin/categorias');
            const categorias = await catResponse.json();
            catSelect.innerHTML = '<option value="">Seleccionar categoría...</option>';
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                if (subcategoria.categoria_id == cat.id) option.selected = true;
                catSelect.appendChild(option);
            });
        }

        const preview = document.getElementById('editSubcategoriaImagenPreview');
        if (preview) {
            preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
            preview.classList.remove('has-image');
        }
        const removeBtn = document.getElementById('editSubcategoriaRemoveImg');
        if (removeBtn) removeBtn.style.display = 'none';

        abrirModalAdmin('modalEditarSubcategoria');
    } catch (error) {
        showAdminToast('Error al cargar la subcategoría', 'error');
    }
}

document.getElementById('formEditarSubcategoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editSubcategoriaId').value;
    const categoriaId = document.getElementById('editSubcategoriaCategoriaId').value;
    const nombre = document.getElementById('editSubcategoriaNombre').value.trim();

    if (!categoriaId || !nombre) {
        showAdminToast('Categoría y nombre son obligatorios', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('categoria_id', categoriaId);
    formData.append('nombre', nombre);
    formData.append('descripcion', document.getElementById('editSubcategoriaDescripcion').value.trim());

    const fileInput = document.getElementById('editSubcategoriaImagenFile');
    if (fileInput.files.length > 0) formData.append('imagen', fileInput.files[0]);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const response = await apiCall(`/admin/subcategorias/${id}`, { method: 'PUT', body: formData });
        const data = await response.json();

        if (response.ok && data.success) {
            showAdminToast(' Subcategoría actualizada', 'success');
            cerrarModalAdmin('modalEditarSubcategoria');
            cargarSubcategorias();
        } else {
            showAdminToast(data.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        showAdminToast('Error de conexión', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
});

// ===== SERVICIOS =====
async function cargarServicios() {
    const tbody = document.getElementById('tablaServicios');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row"> Cargando servicios...</td><\/tr>';

    try {
        const response = await apiCall('/admin/servicios');
        if (!response.ok) throw new Error();

        const servicios = await response.json();
        if (!servicios.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row"> No hay servicios registrados</td><\/tr>';
            return;
        }

        tbody.innerHTML = servicios.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${escapeHtml(s.subcategoria_nombre) || '-'}</td>
                <td>${escapeHtml(s.proveedor_nombre) || '-'}</td>
                <td><strong>${escapeHtml(s.nombre)}</strong></td>
                <td>$${Number(s.precio_base).toLocaleString('es-MX')}</td>
                <td>
                    <span class="status-badge ${s.activo ? 'status-active' : 'status-inactive'}">
                        ${s.activo ? 'Activo' : 'Inactivo'}
                    <\/span>
                </td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarServicio(${s.id})">✏️ Editar<\/button>
                    ${s.activo
                        ? `<button class="action-btn delete-btn" onclick="toggleServicio(${s.id}, 'desactivar')">🗑️ Desactivar<\/button>`
                        : `<button class="action-btn edit-btn" onclick="toggleServicio(${s.id}, 'reactivar')">🔄 Reactivar<\/button>`
                    }
                </td>
            </tr>
        `).join('');

    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row error-row">Error al cargar servicios</td><\/tr>';
    }
}

async function toggleServicio(id, accion) {
    if (!confirm(`¿Estás seguro de ${accion === 'desactivar' ? 'desactivar' : 'reactivar'} este servicio?`)) return;

    try {
        const url = accion === 'desactivar' ? `/admin/servicios/${id}` : `/admin/servicios/${id}/reactivar`;
        const method = accion === 'desactivar' ? 'DELETE' : 'POST';

        const response = await apiCall(url, { method });
        if (response.ok) {
            showAdminToast(`Servicio ${accion === 'desactivar' ? 'desactivado' : 'reactivado'}`, 'success');
            cargarServicios();
        } else {
            const data = await response.json();
            showAdminToast(data.message || 'Error', 'error');
        }
    } catch (error) {
        showAdminToast('Error de conexión', 'error');
    }
}

async function editarServicio(id) {
    try {
        const response = await apiCall(`/admin/servicios/${id}`);
        if (!response.ok) throw new Error();

        const servicio = await response.json();

        document.getElementById('editServicioId').value = servicio.id;
        document.getElementById('editServicioNombre').value = servicio.nombre;
        document.getElementById('editServicioDescripcion').value = servicio.descripcion || '';
        document.getElementById('editServicioPrecioBase').value = servicio.precio_base;
        document.getElementById('editServicioEstado').value = servicio.activo ? '1' : '0';

        await cargarOpcionesSelect('editServicioSubcategoriaId', '/admin/subcategorias', 'nombre', servicio.subcategoria_id);
        await cargarOpcionesSelect('editServicioProveedorId', '/admin/proveedores-list', 'nombre', servicio.proveedor_id);

        const preview = document.getElementById('editServicioImagenPreview');
        if (preview) {
            preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
            preview.classList.remove('has-image');
        }
        const removeBtn = document.getElementById('editServicioRemoveImg');
        if (removeBtn) removeBtn.style.display = 'none';

        abrirModalAdmin('modalEditarServicio');
    } catch (error) {
        showAdminToast('Error al cargar el servicio', 'error');
    }
}

async function cargarOpcionesSelect(selectId, url, textField, selectedId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Cargando...</option>';
    select.disabled = true;

    try {
        const response = await apiCall(url);
        const data = await response.json();

        select.innerHTML = '<option value="">Seleccionar...</option>';
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item[textField] || item.nombre;
            if (selectedId && item.id == selectedId) option.selected = true;
            select.appendChild(option);
        });
        select.disabled = false;
    } catch (error) {
        select.innerHTML = '<option value="">Error al cargar</option>';
    }
}

document.getElementById('formEditarServicio')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editServicioId').value;
    const subcategoriaId = document.getElementById('editServicioSubcategoriaId').value;
    const proveedorId = document.getElementById('editServicioProveedorId').value;
    const nombre = document.getElementById('editServicioNombre').value.trim();
    const precioBase = parseFloat(document.getElementById('editServicioPrecioBase').value);

    if (!subcategoriaId || !proveedorId || !nombre || isNaN(precioBase)) {
        showAdminToast('Todos los campos obligatorios deben estar llenos', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('subcategoria_id', subcategoriaId);
    formData.append('proveedor_id', proveedorId);
    formData.append('nombre', nombre);
    formData.append('descripcion', document.getElementById('editServicioDescripcion').value.trim());
    formData.append('precio_base', precioBase);
    formData.append('activo', document.getElementById('editServicioEstado').value);

    const fileInput = document.getElementById('editServicioImagenFile');
    if (fileInput.files.length > 0) formData.append('imagen', fileInput.files[0]);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const response = await apiCall(`/admin/servicios/${id}`, { method: 'PUT', body: formData });
        const data = await response.json();

        if (response.ok && data.success) {
            showAdminToast(' Servicio actualizado', 'success');
            cerrarModalAdmin('modalEditarServicio');
            cargarServicios();
        } else {
            showAdminToast(data.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        showAdminToast('Error de conexión', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    }
});

// ===== MODALES DE CREACIÓN =====
function initModalCategoria() {
    const btn = document.getElementById('btnNuevaCategoria');
    const modal = document.getElementById('modalCategoria');
    const close = document.getElementById('closeModalCategoria');
    const form = document.getElementById('formCategoria');

    if (!btn || !modal) return;

    btn.addEventListener('click', () => {
        form.reset();
        const preview = document.getElementById('categoriaImagenPreview');
        if (preview) {
            preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
            preview.classList.remove('has-image');
        }
        const removeBtn = document.getElementById('categoriaRemoveImg');
        if (removeBtn) removeBtn.style.display = 'none';
        abrirModalAdmin('modalCategoria');
    });

    close?.addEventListener('click', () => cerrarModalAdmin('modalCategoria'));
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModalAdmin('modalCategoria'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('categoriaNombre').value.trim();
        if (!nombre) {
            showAdminToast('El nombre es obligatorio', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('descripcion', document.getElementById('categoriaDescripcion').value.trim());

        const fileInput = document.getElementById('categoriaImagenFile');
        if (fileInput.files.length > 0) formData.append('imagen', fileInput.files[0]);

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }

        try {
            const response = await apiCall('/admin/categorias', { method: 'POST', body: formData });
            const data = await response.json();

            if (response.ok && data.success) {
                showAdminToast(' Categoría creada', 'success');
                cerrarModalAdmin('modalCategoria');
                cargarCategorias();
            } else {
                showAdminToast(data.message || 'Error al crear', 'error');
            }
        } catch (error) {
            showAdminToast('Error de conexión', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Categoría';
            }
        }
    });
}

function initModalSubcategoria() {
    const btn = document.getElementById('btnNuevaSubcategoria');
    const modal = document.getElementById('modalSubcategoria');
    const close = document.getElementById('closeModalSubcategoria');
    const form = document.getElementById('formSubcategoria');

    if (!btn || !modal) return;

    btn.addEventListener('click', async () => {
        form.reset();
        await cargarOpcionesSelect('subcategoriaCategoriaId', '/admin/categorias', 'nombre');
        const preview = document.getElementById('subcategoriaImagenPreview');
        if (preview) {
            preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
            preview.classList.remove('has-image');
        }
        const removeBtn = document.getElementById('subcategoriaRemoveImg');
        if (removeBtn) removeBtn.style.display = 'none';
        abrirModalAdmin('modalSubcategoria');
    });

    close?.addEventListener('click', () => cerrarModalAdmin('modalSubcategoria'));
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModalAdmin('modalSubcategoria'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoriaId = document.getElementById('subcategoriaCategoriaId').value;
        const nombre = document.getElementById('subcategoriaNombre').value.trim();

        if (!categoriaId || !nombre) {
            showAdminToast('Categoría y nombre son obligatorios', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('categoria_id', categoriaId);
        formData.append('nombre', nombre);
        formData.append('descripcion', document.getElementById('subcategoriaDescripcion').value.trim());

        const fileInput = document.getElementById('subcategoriaImagenFile');
        if (fileInput.files.length > 0) formData.append('imagen', fileInput.files[0]);

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }

        try {
            const response = await apiCall('/admin/subcategorias', { method: 'POST', body: formData });
            const data = await response.json();

            if (response.ok && data.success) {
                showAdminToast(' Subcategoría creada', 'success');
                cerrarModalAdmin('modalSubcategoria');
                cargarSubcategorias();
            } else {
                showAdminToast(data.message || 'Error al crear', 'error');
            }
        } catch (error) {
            showAdminToast('Error de conexión', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Subcategoría';
            }
        }
    });
}

function initModalServicio() {
    const btn = document.getElementById('btnNuevoServicio');
    const modal = document.getElementById('modalServicio');
    const close = document.getElementById('closeModalServicio');
    const form = document.getElementById('formServicio');

    if (!btn || !modal) return;

    btn.addEventListener('click', async () => {
        form.reset();
        await cargarOpcionesSelect('servicioSubcategoriaId', '/admin/subcategorias', 'nombre');
        await cargarOpcionesSelect('servicioProveedorId', '/admin/proveedores-list', 'nombre');
        const preview = document.getElementById('servicioImagenPreview');
        if (preview) {
            preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
            preview.classList.remove('has-image');
        }
        const removeBtn = document.getElementById('servicioRemoveImg');
        if (removeBtn) removeBtn.style.display = 'none';
        abrirModalAdmin('modalServicio');
    });

    close?.addEventListener('click', () => cerrarModalAdmin('modalServicio'));
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModalAdmin('modalServicio'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subcategoriaId = document.getElementById('servicioSubcategoriaId').value;
        const proveedorId = document.getElementById('servicioProveedorId').value;
        const nombre = document.getElementById('servicioNombre').value.trim();
        const precioBase = parseFloat(document.getElementById('servicioPrecioBase').value);

        if (!subcategoriaId || !proveedorId || !nombre || isNaN(precioBase)) {
            showAdminToast('Todos los campos obligatorios son requeridos', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('subcategoria_id', subcategoriaId);
        formData.append('proveedor_id', proveedorId);
        formData.append('nombre', nombre);
        formData.append('descripcion', document.getElementById('servicioDescripcion').value.trim());
        formData.append('precio_base', precioBase);
        formData.append('activo', document.getElementById('servicioEstado').value);

        const fileInput = document.getElementById('servicioImagenFile');
        if (fileInput.files.length > 0) formData.append('imagen', fileInput.files[0]);

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';
        }

        try {
            const response = await apiCall('/admin/servicios', { method: 'POST', body: formData });
            const data = await response.json();

            if (response.ok && data.success) {
                showAdminToast(' Servicio creado', 'success');
                cerrarModalAdmin('modalServicio');
                cargarServicios();
            } else {
                showAdminToast(data.message || 'Error al crear', 'error');
            }
        } catch (error) {
            showAdminToast('Error de conexión', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Servicio';
            }
        }
    });
}

// ===== PREVISUALIZACIÓN DE IMÁGENES =====
function setupImagePreview(type) {
    const fileInput = document.getElementById(`${type}ImagenFile`);
    const preview = document.getElementById(`${type}ImagenPreview`);
    const removeBtn = document.getElementById(`${type}RemoveImg`);

    if (!fileInput || !preview) return;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showAdminToast('La imagen excede 5MB', 'error');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}" alt="Vista previa">`;
            preview.classList.add('has-image');
            if (removeBtn) removeBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    });

    preview.addEventListener('dragover', (e) => {
        e.preventDefault();
        preview.style.borderColor = '#7c3aed';
        preview.style.background = '#faf5ff';
    });

    preview.addEventListener('dragleave', (e) => {
        e.preventDefault();
        preview.style.borderColor = '';
        preview.style.background = '';
    });

    preview.addEventListener('drop', (e) => {
        e.preventDefault();
        preview.style.borderColor = '';
        preview.style.background = '';
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            fileInput.value = '';
            preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
            preview.classList.remove('has-image');
            removeBtn.style.display = 'none';
        });
    }
}

function removeImagePreview(type) {
    const fileInput = document.getElementById(`${type}ImagenFile`);
    const preview = document.getElementById(`${type}ImagenPreview`);
    const removeBtn = document.getElementById(`${type}RemoveImg`);

    if (fileInput) fileInput.value = '';
    if (preview) {
        preview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen</span>';
        preview.classList.remove('has-image');
    }
    if (removeBtn) removeBtn.style.display = 'none';
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initAdminMenu();
    initTabs();
    cargarCategorias();
    initModalCategoria();
    initModalSubcategoria();
    initModalServicio();

    setupImagePreview('categoria');
    setupImagePreview('subcategoria');
    setupImagePreview('servicio');
    setupImagePreview('editCategoria');
    setupImagePreview('editSubcategoria');
    setupImagePreview('editServicio');
});

// Exponer funciones globales (SOLO ADMIN)
window.eliminarCategoria = eliminarCategoria;
window.editarCategoria = editarCategoria;
window.eliminarSubcategoria = eliminarSubcategoria;
window.editarSubcategoria = editarSubcategoria;
window.toggleServicio = toggleServicio;
window.editarServicio = editarServicio;
window.toggleMenu = toggleMenu;
window.removeImagePreview = removeImagePreview;
window.adminLogout = adminLogout;
window.verSolicitudesRegistroAdmin = verSolicitudesRegistroAdmin; 