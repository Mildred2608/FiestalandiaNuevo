// frontend/js/servicios.js
//const API_URL = 'http://localhost:3000/api';

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const subcategoriaId = urlParams.get('id');
const subcategoriaNombre = urlParams.get('nombre');
const eventoId = urlParams.get('eventoId');

// ===== CARGAR SERVICIOS =====
async function cargarServicios() {
    const grid = document.getElementById('serviciosGrid');
    const titulo = document.getElementById('subcategoriaTitulo');
    const descripcion = document.getElementById('subcategoriaDescripcion');
    
    if (eventoId) {
        titulo.textContent = `Servicios para Evento #${eventoId}`;
    } else if (subcategoriaNombre) {
        titulo.textContent = decodeURIComponent(subcategoriaNombre);
    } else {
        titulo.textContent = 'Servicios';
    }
    
    if (!subcategoriaId) {
        grid.innerHTML = '<div class="no-results">No se especificó una subcategoría</div>';
        descripcion.textContent = 'Selecciona una subcategoría desde la página anterior';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/servicios/subcategoria/${subcategoriaId}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const servicios = await response.json();
        
        if (servicios.length === 0) {
            grid.innerHTML = '<div class="no-results">No hay servicios disponibles en esta subcategoría</div>';
            descripcion.textContent = 'No hay servicios registrados';
            return;
        }
        
        descripcion.textContent = `${servicios.length} ${servicios.length === 1 ? 'servicio disponible' : 'servicios disponibles'}`;
        grid.innerHTML = '';
        
        servicios.forEach(serv => {
            const card = document.createElement('div');
            card.classList.add('servicio-card');
            
            // Construir imagen solo si existe
            let imagenHtml = '';
            if (serv.imagen_url && serv.imagen_url.trim() !== '') {
                let imagenUrl = serv.imagen_url;
                if (imagenUrl.startsWith('/uploads')) {
                    const baseUrl = API_URL.replace('/api', '');
                    imagenUrl = `${baseUrl}${imagenUrl}`;
                }
                imagenHtml = `<img src="${imagenUrl}" alt="${escapeHtml(serv.nombre)}" class="servicio-imagen" onerror="this.style.display='none'">`;
            }
            
            card.innerHTML = `
                ${imagenHtml}
                <div class="servicio-info">
                    <h3>${escapeHtml(serv.nombre)}</h3>
                    <p class="servicio-descripcion">${escapeHtml(serv.descripcion || 'Sin descripción')}</p>
                    <p class="servicio-proveedor">👤 ${escapeHtml(serv.proveedor_nombre || 'Proveedor no especificado')}</p>
                    <div class="servicio-precio">
                        $${Number(serv.precio_base).toLocaleString('es-MX')}
                        <small>MXN</small>
                    </div>
                    <button class="btn-agregar-carrito" data-id="${serv.id}" data-nombre="${escapeHtml(serv.nombre)}" data-precio="${serv.precio_base}">
                        🛒 Agregar al carrito
                    </button>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const nombre = btn.dataset.nombre;
                const precio = parseFloat(btn.dataset.precio);
                agregarAlCarrito(id, nombre, precio);
            });
        });
        
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<div class="no-results">Error al cargar servicios. Verifica la conexión.</div>';
    }
}

// Helper para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== SELECCIONAR EVENTO PARA CARRITO =====
async function seleccionarEventoParaCarrito() {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarToast('🔐 Inicia sesión para vincular el servicio a un evento', 'warning');
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.style.display = 'flex';
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/admin/cliente/eventos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('No se pudieron obtener tus eventos');
        }

        const eventos = await response.json();

        if (!eventos || eventos.length === 0) {
            mostrarToast('No tienes eventos. Crea uno antes de agregar servicios.', 'info');
            window.location.href = 'mis-eventos.html';
            return null;
        }

        if (eventos.length === 1) {
            return eventos[0];
        }

        const opciones = eventos.map((ev, idx) => 
            `${idx + 1}. ${ev.nombre_evento || ev.nombre || 'Evento'} (${ev.fecha || 'sin fecha'})`
        ).join('\n');
        
        const seleccion = prompt(`Selecciona el evento para vincular:\n${opciones}\n\nIngresa un número:`);

        if (!seleccion) {
            mostrarToast('Se canceló la selección de evento.', 'info');
            return null;
        }

        const indice = parseInt(seleccion) - 1;
        if (isNaN(indice) || indice < 0 || indice >= eventos.length) {
            mostrarToast('Selección de evento inválida.', 'error');
            return null;
        }

        return eventos[indice];

    } catch (error) {
        console.error('Error al obtener eventos:', error);
        mostrarToast('Error al obtener eventos. Intenta de nuevo.', 'error');
        return null;
    }
}

// ===== AGREGAR AL CARRITO =====
async function agregarAlCarrito(id, nombre, precio) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        mostrarToast('Debes iniciar sesión para agregar al carrito', 'warning');
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.style.display = 'flex';
        return;
    }
    
    let eventoSeleccionado = null;
    
    if (eventoId) {
        eventoSeleccionado = { id: eventoId, nombre_evento: `Evento #${eventoId}` };
    } else {
        eventoSeleccionado = await seleccionarEventoParaCarrito();
    }
    
    if (!eventoSeleccionado) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/carrito/agregar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                servicio_id: id, 
                cantidad: 1,
                evento_id: eventoSeleccionado.id,
                evento_nombre: eventoSeleccionado.nombre_evento || eventoSeleccionado.nombre
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarToast(`"${nombre}" agregado al carrito`, 'success');
            actualizarBadge();
        } else {
            mostrarToast(data.message || 'Error al agregar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al agregar al carrito', 'error');
    }
}

// ===== TOAST =====
function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast', tipo);
    
    const iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${iconos[tipo] || 'ℹ️'}</span>${mensaje}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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
            const total = data.total || 0;
            badge.textContent = total;
            badge.style.display = total > 0 ? 'inline-block' : 'none';
        })
        .catch(() => {
            carritoLocalFallback(badge);
        });
    } else {
        carritoLocalFallback(badge);
    }
}

function carritoLocalFallback(badge) {
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
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.style.display = 'flex';
        };
    }
}

function mostrarMenuUsuario(user) {
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) existingMenu.remove();
    
    let menuContent = `
        <div class="user-menu-header">
            <strong>${escapeHtml(user.nombre)}</strong>
            <small>${escapeHtml(user.email)}</small>
        </div>
        <div class="user-menu-items">
            <a href="#" onclick="verPerfil()">👤 Mi Perfil</a>
    `;
    
    if (user.rol === 'admin') {
        menuContent += `<a href="admin.html">👑 Panel Admin</a>`;
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
    userMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    userMenu.style.left = `${rect.left + window.scrollX - 100}px`;
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

function verPerfil() {
    const user = auth.getCurrentUser();
    alert(`👤 ${user.nombre}\n📧 ${user.email}\n📱 ${user.telefono || 'No especificado'}`);
    const userMenu = document.getElementById('userMenu');
    if (userMenu) userMenu.style.display = 'none';
}

function cerrarSesion() {
    auth.logout();
    window.location.reload();
}

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    if (menu) menu.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    actualizarBotonLogin();
    cargarServicios();
    actualizarBadge();
});

// Exponer funciones globales
window.toggleMenu = toggleMenu;
window.agregarAlCarrito = agregarAlCarrito;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;