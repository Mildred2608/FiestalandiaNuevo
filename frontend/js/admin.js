// frontend/js/admin.js
// API_URL está definida en auth.js

// ===== VERIFICAR SESIÓN DE ADMIN =====
function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'index.html';
    } else {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) adminNameEl.textContent = `👤 ${user.nombre}`;
    }
}

// ===== HELPER: LLAMADAS A API CON AUTH =====
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) }
    });

    return response;
}

// ===== HELPER: MOSTRAR TOAST EN ADMIN =====
function showAdminToast(mensaje, tipo = 'info') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${tipo}`;

    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

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

// ===== HELPER: ABRIR/CERRAR MODAL =====
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

// ===== HELPER: MINIATURA DE IMAGEN =====
function renderMiniatura(imagenUrl, alt = 'Imagen') {
    if (imagenUrl && String(imagenUrl).trim() !== '') {
        return `
            <img 
                src="${imagenUrl}" 
                alt="${alt}" 
                style="width:50px;height:50px;object-fit:cover;border-radius:10px;border:1px solid #e5e7eb;"
                onerror="this.outerHTML='<span style=&quot;font-size:1.4rem&quot;>🖼️</span>';"
            >
        `;
    }

    return '<span style="font-size:1.4rem">📁</span>';
}

// ===== TABS =====
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

// ===== CATEGORÍAS =====
async function cargarCategorias() {
    const tbody = document.getElementById('tablaCategorias');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">⏳ Cargando categorías...</td></tr>';

    try {
        const response = await apiCall('/admin/categorias');

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const categorias = await response.json();

        if (!Array.isArray(categorias) || categorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-row">📭 No hay categorías registradas</td></tr>';
            return;
        }

        tbody.innerHTML = categorias.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${renderMiniatura(cat.imagen_url, cat.nombre)}</td>
                <td><strong>${cat.nombre}</strong></td>
                <td>${cat.descripcion || '<em style="color:#9ca3af">Sin descripción</em>'}</td>
                <td>${cat.creado_en ? new Date(cat.creado_en).toLocaleDateString('es-MX') : '-'}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="eliminarCategoria(${cat.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar categorías:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-row error-row">
                    ⚠️ No se pudo conectar al servidor. Verifica que el backend esté activo.
                </td>
            </tr>
        `;
    }
}

async function eliminarCategoria(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer.')) return;

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

// ===== SUBCATEGORÍAS =====
async function cargarSubcategorias() {
    const tbody = document.getElementById('tablaSubcategorias');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">⏳ Cargando subcategorías...</td></tr>';

    try {
        const response = await apiCall('/admin/subcategorias');

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const subcategorias = await response.json();

        if (!Array.isArray(subcategorias) || subcategorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-row">📭 No hay subcategorías registradas</td></tr>';
            return;
        }

        tbody.innerHTML = subcategorias.map(sub => `
            <tr>
                <td>${sub.id}</td>
                <td><span class="category-badge">${sub.categoria_nombre || 'Sin categoría'}</span></td>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${renderMiniatura(sub.imagen_url, sub.nombre)}
                        <strong>${sub.nombre}</strong>
                    </div>
                </td>
                <td>${sub.descripcion || '<em style="color:#9ca3af">Sin descripción</em>'}</td>
                <td>${sub.creado_en ? new Date(sub.creado_en).toLocaleDateString('es-MX') : '-'}</td>
                <td>
                    <button type="button" class="action-btn delete-btn btn-eliminar-subcategoria" data-id="${sub.id}">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar subcategorías:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-row error-row">
                    ⚠️ No se pudo conectar al servidor. Verifica que el backend esté activo.
                </td>
            </tr>
        `;
    }
}

async function eliminarSubcategoria(id) {
    const confirmar = confirm('¿Estás seguro de que deseas eliminar esta subcategoría? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
        const response = await apiCall(`/admin/subcategorias/${id}`, { method: 'DELETE' });

        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }

        if (response.ok) {
            showAdminToast(data.message || 'Subcategoría eliminada correctamente', 'success');
            cargarSubcategorias();
        } else {
            showAdminToast(data.message || 'Error al eliminar subcategoría', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar subcategoría:', error);
        showAdminToast('Error de conexión', 'error');
    }
}

// ===== SERVICIOS =====
async function cargarServicios() {
    const tbody = document.getElementById('tablaServicios');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">⏳ Cargando servicios...</td></tr>';

    try {
        const response = await apiCall('/admin/servicios');

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const servicios = await response.json();

        if (!Array.isArray(servicios) || servicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">📭 No hay servicios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = servicios.map(s => `
            <tr>
                <td>${s.id}</td>
                <td>${s.subcategoria_nombre || '-'}</td>
                <td>${s.proveedor_nombre || '-'}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${renderMiniatura(s.imagen_url, s.nombre)}
                        <strong>${s.nombre}</strong>
                    </div>
                </td>
                <td>$${Number(s.precio_base).toLocaleString('es-MX')}</td>
                <td>
                    <span class="status-badge ${s.activo ? 'status-active' : 'status-inactive'}">
                        ${s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" onclick="editarServicio(${s.id})">✏️ Editar</button>
                    ${s.activo
                        ? `<button class="action-btn delete-btn" onclick="toggleServicio(${s.id}, 'desactivar')">🗑️ Desactivar</button>`
                        : `<button class="action-btn edit-btn" onclick="toggleServicio(${s.id}, 'reactivar')">🔄 Reactivar</button>`
                    }
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar servicios:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row error-row">
                    ⚠️ No se pudo conectar al servidor. Verifica que el backend esté activo.
                </td>
            </tr>
        `;
    }
}

async function toggleServicio(id, accion) {
    if (!confirm(`¿Estás seguro de ${accion === 'desactivar' ? 'desactivar' : 'reactivar'} este servicio?`)) return;

    try {
        const url = accion === 'desactivar'
            ? `/admin/servicios/${id}`
            : `/admin/servicios/${id}/reactivar`;

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
    showAdminToast('Función de edición próximamente', 'info');
}

// ===== HELPER: CARGAR CATEGORÍAS PARA SELECTS =====
async function cargarCategoriasParaSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Cargando categorías...</option>';
    select.disabled = true;

    try {
        const response = await apiCall('/admin/categorias');
        if (!response.ok) throw new Error();

        const categorias = await response.json();

        select.innerHTML = '<option value="">Seleccionar categoría...</option>';

        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nombre;
            select.appendChild(opt);
        });

        select.disabled = false;
    } catch {
        select.innerHTML = '<option value="">Error al cargar categorías</option>';
    }
}

// ===== HELPER: CARGAR SUBCATEGORÍAS PARA SELECTS =====
async function cargarSubcategoriasParaSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Cargando subcategorías...</option>';
    select.disabled = true;

    try {
        const response = await apiCall('/admin/subcategorias');
        if (!response.ok) throw new Error();

        const subcategorias = await response.json();

        select.innerHTML = '<option value="">Seleccionar subcategoría...</option>';

        subcategorias.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.id;
            opt.textContent = `${sub.categoria_nombre ? sub.categoria_nombre + ' › ' : ''}${sub.nombre}`;
            select.appendChild(opt);
        });

        select.disabled = false;
    } catch {
        select.innerHTML = '<option value="">Error al cargar subcategorías</option>';
    }
}

// ===== HELPER: CARGAR PROVEEDORES PARA SELECTS =====
async function cargarProveedoresParaSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Cargando proveedores...</option>';
    select.disabled = true;

    try {
        const response = await apiCall('/admin/proveedores-list');
        if (!response.ok) throw new Error();

        const proveedores = await response.json();

        select.innerHTML = '<option value="">Seleccionar proveedor...</option>';

        if (proveedores.length === 0) {
            select.innerHTML = '<option value="">No hay proveedores aprobados</option>';
        } else {
            proveedores.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nombre;
                select.appendChild(opt);
            });
        }

        select.disabled = false;
    } catch {
        select.innerHTML = '<option value="">Error al cargar proveedores</option>';
    }
}

// ===== MODAL NUEVA CATEGORÍA =====
function initModalCategoria() {
    const btnNueva = document.getElementById('btnNuevaCategoria');
    const modal = document.getElementById('modalCategoria');
    const closeBtn = document.getElementById('closeModalCategoria');
    const form = document.getElementById('formCategoria');

    if (!btnNueva || !modal || !form) return;

    btnNueva.addEventListener('click', () => {
        form.reset();
        clearFormErrors(form);
        document.getElementById('categoriaId').value = '';
        document.getElementById('modalCategoriaTitle').textContent = 'Nueva Categoría';
        abrirModalAdmin('modalCategoria');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => cerrarModalAdmin('modalCategoria'));
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalAdmin('modalCategoria');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors(form);

        const nombre = document.getElementById('categoriaNombre').value.trim();
        const descripcion = document.getElementById('categoriaDescripcion').value.trim();
        const imagenUrl = document.getElementById('categoriaImagenUrl').value.trim();

        if (!nombre) {
            showFieldError('categoriaNombreError', 'El nombre es obligatorio');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, true, 'Guardando...');

        try {
            const response = await apiCall('/admin/categorias', {
                method: 'POST',
                body: JSON.stringify({
                    nombre,
                    descripcion,
                    imagen_url: imagenUrl || null
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAdminToast('¡Categoría creada exitosamente! ✨', 'success');
                cerrarModalAdmin('modalCategoria');
                cargarCategorias();
            } else {
                showAdminToast(data.message || 'Error al guardar la categoría', 'error');
            }
        } catch (error) {
            showAdminToast('Error de conexión con el servidor', 'error');
        } finally {
            setButtonLoading(submitBtn, false, 'Guardar Categoría');
        }
    });
}

// ===== MODAL NUEVA SUBCATEGORÍA =====
function initModalSubcategoria() {
    const btnNueva = document.getElementById('btnNuevaSubcategoria');
    const modal = document.getElementById('modalSubcategoria');
    const closeBtn = document.getElementById('closeModalSubcategoria');
    const form = document.getElementById('formSubcategoria');

    if (!btnNueva || !modal || !form) return;

    btnNueva.addEventListener('click', () => {
        form.reset();
        clearFormErrors(form);
        document.getElementById('subcategoriaId').value = '';
        cargarCategoriasParaSelect('subcategoriaCategoriaId');
        abrirModalAdmin('modalSubcategoria');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => cerrarModalAdmin('modalSubcategoria'));
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalAdmin('modalSubcategoria');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors(form);

        const categoriaId = document.getElementById('subcategoriaCategoriaId').value;
        const nombre = document.getElementById('subcategoriaNombre').value.trim();
        const descripcion = document.getElementById('subcategoriaDescripcion').value.trim();
        const imagenUrl = document.getElementById('subcategoriaImagenUrl').value.trim();

        let valid = true;

        if (!categoriaId) {
            showFieldError('subcategoriaCategoriaError', 'Debes seleccionar una categoría');
            valid = false;
        }

        if (!nombre) {
            showFieldError('subcategoriaNombreError', 'El nombre es obligatorio');
            valid = false;
        }

        if (!valid) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, true, 'Guardando...');

        try {
            const response = await apiCall('/admin/subcategorias', {
                method: 'POST',
                body: JSON.stringify({
                    categoria_id: categoriaId,
                    nombre,
                    descripcion,
                    imagen_url: imagenUrl || null
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAdminToast('¡Subcategoría creada exitosamente! ✨', 'success');
                cerrarModalAdmin('modalSubcategoria');
                cargarSubcategorias();
            } else {
                showAdminToast(data.message || 'Error al guardar la subcategoría', 'error');
            }
        } catch (error) {
            showAdminToast('Error de conexión con el servidor', 'error');
        } finally {
            setButtonLoading(submitBtn, false, 'Guardar Subcategoría');
        }
    });
}

// ===== MODAL NUEVO SERVICIO =====
function initModalServicio() {
    const btnNuevo = document.getElementById('btnNuevoServicio');
    const modal = document.getElementById('modalServicio');
    const closeBtn = document.getElementById('closeModalServicio');
    const form = document.getElementById('formServicio');

    if (!btnNuevo || !modal || !form) return;

    btnNuevo.addEventListener('click', () => {
        form.reset();
        clearFormErrors(form);
        cargarSubcategoriasParaSelect('servicioSubcategoriaId');
        cargarProveedoresParaSelect('servicioProveedorId');
        abrirModalAdmin('modalServicio');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => cerrarModalAdmin('modalServicio'));
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalAdmin('modalServicio');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors(form);

        const subcategoriaId = document.getElementById('servicioSubcategoriaId').value;
        const proveedorId = document.getElementById('servicioProveedorId').value;
        const nombre = document.getElementById('servicioNombre').value.trim();
        const descripcion = document.getElementById('servicioDescripcion').value.trim();
        const imagenUrl = document.getElementById('servicioImagenUrl').value.trim();
        const precioBase = parseFloat(document.getElementById('servicioPrecioBase').value);
        const activo = document.getElementById('servicioEstado').value === '1' ? 1 : 0;

        let valid = true;

        if (!subcategoriaId) {
            showFieldError('servicioSubcategoriaError', 'Selecciona una subcategoría');
            valid = false;
        }

        if (!proveedorId) {
            showFieldError('servicioProveedorError', 'Selecciona un proveedor');
            valid = false;
        }

        if (!nombre) {
            showFieldError('servicioNombreError', 'El nombre es obligatorio');
            valid = false;
        }

        if (isNaN(precioBase) || precioBase < 0) {
            showFieldError('servicioPrecioError', 'El precio debe ser un número válido mayor o igual a 0');
            valid = false;
        }

        if (!valid) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, true, 'Guardando...');

        try {
            const response = await apiCall('/admin/servicios', {
                method: 'POST',
                body: JSON.stringify({
                    subcategoria_id: subcategoriaId,
                    proveedor_id: proveedorId,
                    nombre,
                    descripcion,
                    precio_base: precioBase,
                    activo,
                    imagen_url: imagenUrl || null
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAdminToast('¡Servicio creado exitosamente! ✨', 'success');
                cerrarModalAdmin('modalServicio');
                cargarServicios();
            } else {
                showAdminToast(data.message || 'Error al guardar el servicio', 'error');
            }
        } catch (error) {
            showAdminToast('Error de conexión con el servidor', 'error');
        } finally {
            setButtonLoading(submitBtn, false, 'Guardar Servicio');
        }
    });
}

// ===== UTILIDADES DE FORMULARIO =====
function showFieldError(errorId, message) {
    const el = document.getElementById(errorId);
    if (el) {
        el.textContent = message;
        el.classList.add('visible');
    }
}

function clearFormErrors(form) {
    form.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
}

function setButtonLoading(btn, loading, text) {
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = text;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initModalCategoria();
    initModalSubcategoria();
    initModalServicio();
    cargarCategorias();

    // Delegación de eventos para eliminar subcategorías
    const tablaSubcategorias = document.getElementById('tablaSubcategorias');

    if (tablaSubcategorias) {
        tablaSubcategorias.addEventListener('click', (e) => {
            const botonEliminar = e.target.closest('.btn-eliminar-subcategoria');
            if (!botonEliminar) return;

            const id = botonEliminar.dataset.id;
            if (id) {
                eliminarSubcategoria(id);
            }
        });
    }
});