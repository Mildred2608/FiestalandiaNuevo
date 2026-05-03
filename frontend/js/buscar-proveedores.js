// frontend/js/buscar-proveedores.js
//const API_URL = 'http://localhost:3000/api';

let serviciosGlobales = [];

// ===== CARGAR CATEGORÍAS =====
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/categorias`);
        const categorias = await response.json();
        const select = document.getElementById('filtroCategoria');
        
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// ===== CARGAR SERVICIOS =====
async function cargarServicios() {
    const grid = document.getElementById('serviciosGrid');
    
    try {
        const response = await fetch(`${API_URL}/servicios/publicos`);
        serviciosGlobales = await response.json();
        
        if (serviciosGlobales.length === 0) {
            grid.innerHTML = '<div class="no-data">No hay servicios disponibles</div>';
            return;
        }
        
        mostrarServicios(serviciosGlobales);
        
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<div class="error">Error al cargar servicios</div>';
    }
}

// ===== MOSTRAR SERVICIOS =====
function mostrarServicios(servicios) {
    const grid = document.getElementById('serviciosGrid');
    
    if (servicios.length === 0) {
        grid.innerHTML = '<div class="no-data">No hay servicios en esta categoría</div>';
        return;
    }
    
    grid.innerHTML = servicios.map(serv => `
        <div class="servicio-card">
            <div class="servicio-header">
                <h3 class="servicio-nombre">${serv.nombre}</h3>
                <div class="servicio-proveedor">👤 ${serv.proveedor || 'Proveedor'}</div>
            </div>
            <div class="servicio-body">
                <p class="servicio-descripcion">${serv.descripcion || 'Sin descripción'}</p>
                <div class="servicio-precio">
                    $${Number(serv.precio_base).toLocaleString('es-MX')}
                </div>
                <button class="btn-solicitar" onclick="abrirModalSolicitud(${serv.id}, '${serv.nombre.replace(/'/g, "\\'")}', '${serv.proveedor?.replace(/'/g, "\\'") || ''}', ${serv.precio_base})">
                    📋 Solicitar servicio
                </button>
            </div>
        </div>
    `).join('');
}

// ===== FILTRAR SERVICIOS =====
function filtrarServicios() {
    const categoriaId = document.getElementById('filtroCategoria').value;
    const subcategoriaId = document.getElementById('filtroSubcategoria').value;
    
    let filtrados = [...serviciosGlobales];
    
    if (categoriaId) {
        filtrados = filtrados.filter(s => s.categoria_id == categoriaId);
        actualizarSubcategorias(categoriaId);
    }
    
    if (subcategoriaId) {
        filtrados = filtrados.filter(s => s.subcategoria_id == subcategoriaId);
    }
    
    mostrarServicios(filtrados);
}

// ===== ACTUALIZAR SUBCATEGORÍAS =====
async function actualizarSubcategorias(categoriaId) {
    try {
        const response = await fetch(`${API_URL}/subcategorias/categoria/${categoriaId}`);
        const subcategorias = await response.json();
        const select = document.getElementById('filtroSubcategoria');
        
        select.innerHTML = '<option value="">Todas las subcategorías</option>';
        subcategorias.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.id;
            option.textContent = sub.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// ===== ABRIR MODAL SOLICITUD =====
function abrirModalSolicitud(id, nombre, proveedor, precio) {
    const user = auth.getCurrentUser();
    if (!user) {
        mostrarToast('Debes iniciar sesión para solicitar un servicio', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    document.getElementById('servicioId').value = id;
    document.getElementById('servicioNombre').textContent = nombre;
    document.getElementById('servicioProveedorNombre').textContent = `Proveedor: ${proveedor}`;
    document.getElementById('servicioPrecio').textContent = `$${Number(precio).toLocaleString('es-MX')}`;
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaEvento').min = hoy;
    
    document.getElementById('modalSolicitud').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ===== ENVIAR SOLICITUD =====
async function enviarSolicitud(event) {
    event.preventDefault();
    
    const user = auth.getCurrentUser();
    if (!user) {
        mostrarToast('Debes iniciar sesión', 'warning');
        return;
    }
    
    const solicitud = {
        servicio_id: document.getElementById('servicioId').value,
        fecha_evento: document.getElementById('fechaEvento').value || null,
        cantidad: document.getElementById('cantidad').value,
        mensaje: document.getElementById('mensaje').value
    };
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/proveedor/solicitar-servicio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(solicitud)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarToast('✅ Solicitud enviada al proveedor', 'success');
            cerrarModalSolicitud();
        } else {
            mostrarToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al enviar solicitud', 'error');
    }
}

function cerrarModalSolicitud() {
    document.getElementById('modalSolicitud').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('formSolicitud').reset();
}

function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast', tipo);
    
    let icono = '📌';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
    
    toast.innerHTML = `<span class="toast-icon">${icono}</span>${mensaje}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

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
    }
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    menu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Buscar Proveedores iniciado');
    actualizarBotonLogin();
    actualizarBadge();
    cargarCategorias();
    cargarServicios();
    
    document.getElementById('filtroCategoria').addEventListener('change', filtrarServicios);
    document.getElementById('filtroSubcategoria').addEventListener('change', filtrarServicios);
    document.getElementById('closeModalSolicitud').addEventListener('click', cerrarModalSolicitud);
    document.getElementById('formSolicitud').addEventListener('submit', enviarSolicitud);
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalSolicitud')) {
            cerrarModalSolicitud();
        }
    });
});

window.abrirModalSolicitud = abrirModalSolicitud;
window.toggleMenu = toggleMenu;