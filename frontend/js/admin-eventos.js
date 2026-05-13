// frontend/js/admin-eventos.js

// ===== VERIFICACIÓN DE AUTENTICACIÓN =====
function checkAdminAuth() {
    const user = auth.getCurrentUser();
    if (!user || user.rol !== 'admin') {
        window.location.href = 'admin.html';
    } else {
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = `👤 ${user.nombre}`;
        }
    }
}

// ===== TOAST (reutilizado de admin.js, definido aquí por si se carga solo) =====
function showEventToast(mensaje, tipo = 'info') {
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

// ===== HELPERS DE MODALES =====
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== CACHE DE TODOS LOS EVENTOS PARA FILTRO FRONTEND =====
let todosLosEventos = [];

// ===== CARGAR EVENTOS =====
async function cargarEventos(fechaFiltro = null) {
    const tbody = document.getElementById('tablaEventos');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row">⏳ Cargando eventos...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/admin/eventos`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}`);
        }

        const eventos = await response.json();
        todosLosEventos = eventos; // Guardar cache para filtro frontend

        renderizarEventos(eventos, fechaFiltro);

    } catch (error) {
        console.error('Error al cargar eventos:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-row">❌ Error al cargar eventos: ${error.message || 'Error de conexión'}</td></tr>`;
    }
}

// ===== RENDERIZAR TABLA =====
function renderizarEventos(eventos, fechaFiltro = null) {
    const tbody = document.getElementById('tablaEventos');

    let eventosFiltrados = eventos;

    // Filtro por fecha en frontend
    if (fechaFiltro) {
        eventosFiltrados = eventos.filter(ev => {
            if (!ev.fecha) return false;
            const fechaEvento = new Date(ev.fecha).toISOString().split('T')[0];
            return fechaEvento === fechaFiltro;
        });
    }

    if (!Array.isArray(eventosFiltrados) || eventosFiltrados.length === 0) {
        const msg = fechaFiltro
            ? '📭 No hay eventos registrados para esta fecha'
            : '📭 No hay eventos registrados';
        tbody.innerHTML = `<tr><td colspan="7" class="loading-row">${msg}</td></tr>`;
        return;
    }

    tbody.innerHTML = eventosFiltrados.map(ev => `
        <tr>
            <td>${ev.evento_id || ev.id}</td>
            <td><strong>${ev.nombre_evento || 'Sin nombre'}</strong></td>
            <td>${ev.cliente_nombre || 'Anónimo'}<br><small>${ev.cliente_email || ''}</small></td>
            <td>${ev.tipo || '-'}</td>
            <td>${ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-MX') : '-'}</td>
            <td>${ev.invitados || '0'} personas</td>
            <td>
                <button class="action-btn view-btn" onclick="verEvento(${ev.evento_id || ev.id})">👁️ Ver</button>
                <button class="action-btn edit-btn" onclick="editarEvento(${ev.evento_id || ev.id})">✏️ Editar</button>
                <button class="action-btn delete-btn" onclick="confirmarEliminarEvento(${ev.evento_id || ev.id}, '${(ev.nombre_evento || 'Sin nombre').replace(/'/g, "\\'")}')">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ===== FUNCIONALIDAD 1: VER EVENTO =====
async function verEvento(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/eventos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener el evento');
        }

        const ev = await response.json();

        const contenido = document.getElementById('eventoDetalleContent');
        contenido.innerHTML = `
            <div class="detalle-row">
                <span class="detalle-label">ID:</span>
                <span class="detalle-value">${ev.evento_id || ev.id}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Evento:</span>
                <span class="detalle-value">${ev.nombre_evento || 'Sin nombre'}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Cliente:</span>
                <span class="detalle-value">${ev.cliente_nombre || 'Anónimo'}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Correo:</span>
                <span class="detalle-value">${ev.cliente_email || 'No disponible'}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Tipo:</span>
                <span class="detalle-value">${ev.tipo || 'Sin tipo'}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Fecha:</span>
                <span class="detalle-value">${ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No definida'}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Invitados:</span>
                <span class="detalle-value">${ev.invitados || 0} personas</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Ubicación:</span>
                <span class="detalle-value">${ev.ubicacion || 'No especificada'}</span>
            </div>
            <div class="detalle-row">
                <span class="detalle-label">Notas:</span>
                <span class="detalle-value">${ev.mensaje || 'Sin notas'}</span>
            </div>
        `;

        abrirModal('modalVerEvento');

    } catch (error) {
        console.error('Error al ver evento:', error);
        showEventToast('Error al cargar detalles del evento', 'error');
    }
}

// ===== FUNCIONALIDAD 2: EDITAR EVENTO =====
async function editarEvento(id) {
    try {
        const token = localStorage.getItem('token');

        // Cargar datos del evento
        const response = await fetch(`${API_URL}/admin/eventos/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('No se pudo obtener el evento');
        }

        const ev = await response.json();

        // Cargar tipos de evento para el select
        await cargarTiposEvento(ev.tipo_id);

        // Precargar campos del formulario
        document.getElementById('editEventoId').value = ev.evento_id || ev.id;
        document.getElementById('editEventoNombre').value = ev.nombre_evento || '';

        // Formatear fecha para input date (YYYY-MM-DD)
        if (ev.fecha) {
            const fechaFormateada = new Date(ev.fecha).toISOString().split('T')[0];
            document.getElementById('editEventoFecha').value = fechaFormateada;
        } else {
            document.getElementById('editEventoFecha').value = '';
        }

        document.getElementById('editEventoInvitados').value = ev.invitados || 0;
        document.getElementById('editEventoUbicacion').value = ev.ubicacion || '';
        document.getElementById('editEventoNotas').value = ev.mensaje || '';

        abrirModal('modalEditarEvento');

    } catch (error) {
        console.error('Error al cargar evento para editar:', error);
        showEventToast('Error al cargar datos del evento', 'error');
    }
}

// Cargar tipos de evento en el select
async function cargarTiposEvento(selectedId = null) {
    const select = document.getElementById('editEventoTipo');
    if (!select) return;

    select.innerHTML = '<option value="">Cargando...</option>';
    select.disabled = true;

    try {
        const response = await fetch(`${API_URL}/tipos-evento`);
        const tipos = await response.json();

        select.innerHTML = '<option value="">Seleccionar tipo...</option>';

        if (Array.isArray(tipos)) {
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id;
                option.textContent = tipo.nombre;
                if (selectedId && tipo.id == selectedId) option.selected = true;
                select.appendChild(option);
            });
        }

        select.disabled = false;
    } catch (error) {
        console.error('Error al cargar tipos de evento:', error);
        select.innerHTML = '<option value="">Error al cargar tipos</option>';
    }
}

// Submit del formulario de edición
document.getElementById('formEditarEvento')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editEventoId').value;
    const nombre_evento = document.getElementById('editEventoNombre').value.trim();
    const tipo_id = document.getElementById('editEventoTipo').value;
    const fecha = document.getElementById('editEventoFecha').value;
    const invitados = parseInt(document.getElementById('editEventoInvitados').value) || 0;
    const ubicacion = document.getElementById('editEventoUbicacion').value.trim();
    const mensaje = document.getElementById('editEventoNotas').value.trim();

    // Validaciones
    if (!nombre_evento) {
        showEventToast('El nombre del evento es obligatorio', 'error');
        return;
    }
    if (!fecha) {
        showEventToast('La fecha es obligatoria', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/eventos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre_evento,
                tipo_id: tipo_id || null,
                fecha,
                invitados,
                ubicacion: ubicacion || null,
                mensaje: mensaje || null
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showEventToast('Evento actualizado exitosamente', 'success');
            cerrarModal('modalEditarEvento');
            // Recargar tabla sin recargar la página
            const filtroFecha = document.getElementById('filtroFecha')?.value || null;
            await cargarEventos(filtroFecha);
        } else {
            showEventToast(data.message || 'Error al actualizar evento', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        showEventToast('Error de conexión al actualizar', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Guardar Cambios';
        }
    }
});

// ===== FUNCIONALIDAD 3: ELIMINAR EVENTO =====
function confirmarEliminarEvento(id, nombre) {
    document.getElementById('eliminarEventoId').value = id;
    document.getElementById('eliminarEventoNombre').textContent = nombre;
    abrirModal('modalEliminarEvento');
}

async function ejecutarEliminarEvento() {
    const id = document.getElementById('eliminarEventoId').value;
    const btnEliminar = document.getElementById('btnConfirmarEliminar');

    if (btnEliminar) {
        btnEliminar.disabled = true;
        btnEliminar.textContent = 'Eliminando...';
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/eventos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showEventToast('Evento eliminado exitosamente', 'success');
            cerrarModal('modalEliminarEvento');
            // Recargar tabla sin recargar la página
            const filtroFecha = document.getElementById('filtroFecha')?.value || null;
            await cargarEventos(filtroFecha);
        } else {
            showEventToast(data.message || 'Error al eliminar evento', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        showEventToast('Error de conexión al eliminar', 'error');
    } finally {
        if (btnEliminar) {
            btnEliminar.disabled = false;
            btnEliminar.textContent = '🗑️ Eliminar';
        }
    }
}

// ===== FUNCIONALIDAD 4: FILTRO POR FECHA =====
document.getElementById('filtroFecha')?.addEventListener('change', (e) => {
    const fecha = e.target.value;
    const btnLimpiar = document.getElementById('btnLimpiarFiltro');

    if (fecha) {
        // Filtrar en frontend con los datos cacheados
        renderizarEventos(todosLosEventos, fecha);
        if (btnLimpiar) btnLimpiar.style.display = 'inline-block';
    } else {
        // Sin filtro: mostrar todos
        renderizarEventos(todosLosEventos);
        if (btnLimpiar) btnLimpiar.style.display = 'none';
    }
});

// Botón limpiar filtro
document.getElementById('btnLimpiarFiltro')?.addEventListener('click', () => {
    const filtroInput = document.getElementById('filtroFecha');
    if (filtroInput) filtroInput.value = '';

    renderizarEventos(todosLosEventos);

    const btnLimpiar = document.getElementById('btnLimpiarFiltro');
    if (btnLimpiar) btnLimpiar.style.display = 'none';
});

// ===== INICIALIZACIÓN DE MODALES =====
function initModalesEventos() {
    // Modal Ver - cerrar
    document.getElementById('closeModalVer')?.addEventListener('click', () => cerrarModal('modalVerEvento'));
    document.getElementById('modalVerEvento')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalVerEvento') cerrarModal('modalVerEvento');
    });

    // Modal Editar - cerrar
    document.getElementById('closeModalEditar')?.addEventListener('click', () => cerrarModal('modalEditarEvento'));
    document.getElementById('modalEditarEvento')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalEditarEvento') cerrarModal('modalEditarEvento');
    });

    // Modal Eliminar - cerrar y acciones
    document.getElementById('closeModalEliminar')?.addEventListener('click', () => cerrarModal('modalEliminarEvento'));
    document.getElementById('modalEliminarEvento')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalEliminarEvento') cerrarModal('modalEliminarEvento');
    });
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', () => cerrarModal('modalEliminarEvento'));
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', () => ejecutarEliminarEvento());

    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal('modalVerEvento');
            cerrarModal('modalEditarEvento');
            cerrarModal('modalEliminarEvento');
        }
    });
}

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initModalesEventos();

    // Revisar si hay filtro de fecha en URL
    const params = new URLSearchParams(window.location.search);
    const fechaParam = params.get('fecha');
    if (fechaParam) {
        const filtroInput = document.getElementById('filtroFecha');
        if (filtroInput) filtroInput.value = fechaParam;
        cargarEventos(fechaParam);
    } else {
        cargarEventos();
    }
});