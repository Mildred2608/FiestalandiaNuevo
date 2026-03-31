// frontend/js/servicios.js
//const API_URL = 'http://localhost:3000/api';

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const subcategoriaId = urlParams.get('id');
const subcategoriaNombre = urlParams.get('nombre');
const eventoId = urlParams.get('eventoId');

// fallback: si se pasa eventoId, mostrarlo en título
document.addEventListener('DOMContentLoaded', () => {
    if (eventoId) {
        const tituloe = document.getElementById('subcategoriaTitulo');
        if (tituloe) tituloe.textContent += ` (Evento #${eventoId})`;
    }
});

// ===== CARGAR SERVICIOS =====
async function cargarServicios() {
    const grid = document.getElementById('serviciosGrid');
    const titulo = document.getElementById('subcategoriaTitulo');
    const descripcion = document.getElementById('subcategoriaDescripcion');
    
    // Mostrar el título aunque no haya ID (por si acaso)
    if (subcategoriaNombre) {
        titulo.textContent = decodeURIComponent(subcategoriaNombre);
    } else {
        titulo.textContent = 'Servicios';
    }
    
    // Si no hay ID, mostrar mensaje pero NO redirigir
    if (!subcategoriaId) {
        grid.innerHTML = '<div class="no-results">No se especificó una subcategoría</div>';
        descripcion.textContent = 'Selecciona una subcategoría desde la página anterior';
        return;
    }
    
    try {
        console.log('🔍 Cargando servicios para subcategoría ID:', subcategoriaId);
        
        const response = await fetch(`${API_URL}/servicios/subcategoria/${subcategoriaId}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const servicios = await response.json();
        console.log('✅ Servicios encontrados:', servicios.length);
        
        if (servicios.length === 0) {
            grid.innerHTML = '<div class="no-results">No hay servicios disponibles en esta subcategoría</div>';
            descripcion.textContent = 'No hay servicios registrados';
            return;
        }
        
        descripcion.textContent = `${servicios.length} servicio(s) disponible(s)`;
        grid.innerHTML = '';
        
        servicios.forEach(serv => {
            const card = document.createElement('div');
            card.classList.add('servicio-card');
            
            const imagenUrl = obtenerImagenPorTipo(serv.nombre, serv.descripcion);
            
            card.innerHTML = `
                <img src="${imagenUrl}" alt="${serv.nombre}" class="servicio-imagen" onerror="this.src='https://images.unsplash.com/photo-1511795409834-ef04bbd61622'">
                <div class="servicio-info">
                    <h3>${serv.nombre}</h3>
                    <p class="servicio-descripcion">${serv.descripcion || 'Sin descripción'}</p>
                    <p class="servicio-proveedor">👤 ${serv.proveedor_nombre || 'Proveedor no especificado'}</p>
                    <div class="servicio-precio">
                        $${Number(serv.precio_base).toLocaleString('es-MX')}
                        <small>MXN</small>
                    </div>
                    <button class="btn-agregar-carrito" onclick="agregarAlCarrito(${serv.id}, '${serv.nombre.replace(/'/g, "\\'")}', ${serv.precio_base})">
                        🛒 Agregar al carrito
                    </button>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        grid.innerHTML = '<div class="no-results">Error al cargar servicios. Verifica la conexión.</div>';
    }
}

// ===== FUNCIÓN PARA OBTENER IMAGEN SEGÚN TIPO DE SERVICIO =====
function obtenerImagenPorTipo(nombre, descripcion) {
    const texto = (nombre + ' ' + (descripcion || '')).toLowerCase();
    
    // Lugar
    if (texto.includes('salón') || texto.includes('salon')) {
        return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('jardín') || texto.includes('jardin')) {
        return 'https://images.unsplash.com/photo-1587061949409-278efe9e1420?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('terraza')) {
        return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('hacienda')) {
        return 'https://images.unsplash.com/photo-1599607604112-9b6c1180a1a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    
    // Música
    if (texto.includes('dj')) {
        return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('mariachi')) {
        return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('grupo musical') || texto.includes('banda')) {
        return 'https://images.unsplash.com/photo-1501286353178-1ec871214bc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    
    // Banquetes
    if (texto.includes('comida') || texto.includes('banquete')) {
        return 'https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('postre')) {
        return 'https://images.unsplash.com/photo-1488477181946-6428a029177e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('bebida') || texto.includes('coctel')) {
        return 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    
    // Decoración
    if (texto.includes('decoración') || texto.includes('decoracion')) {
        return 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('flor')) {
        return 'https://images.unsplash.com/photo-1561124795-7545ee4c2319?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    if (texto.includes('globo')) {
        return 'https://images.unsplash.com/photo-1530107623750-0aa0c5bc654e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }
    
    // Imagen por defecto
    return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
}

// ===== SELECCIONAR EVENTO PARA CARRITO =====
async function seleccionarEventoParaCarrito() {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarToast('🔐 Inicia sesión para vincular el servicio a un evento', 'warning');
        document.getElementById('authModal').style.display = 'flex';
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

        const opciones = eventos.map((ev, idx) => `${idx + 1}. ${ev.nombre_evento || ev.nombre || 'Evento'} (${ev.fecha || 'no fecha'})`).join('\n');
        const seleccion = window.prompt(`Selecciona el evento para vincular:\n${opciones}\n\nIngresa un número:`);

        if (!seleccion) {
            mostrarToast('Se canceló la selección de evento.', 'info');
            return null;
        }

        const indice = Number(seleccion) - 1;
        if (Number.isNaN(indice) || indice < 0 || indice >= eventos.length) {
            mostrarToast('Selección de evento inválida.', 'error');
            return null;
        }

        return eventos[indice];

    } catch (error) {
        console.error('Error al obtener eventos de cliente:', error);
        mostrarToast('Error al obtener eventos. Intenta de nuevo.', 'error');
        return null;
    }
}

// ===== FUNCIÓN PARA AGREGAR AL CARRITO (CONECTADA A BD) =====
async function agregarAlCarrito(id, nombre, precio) {
    console.log('🛒 Agregando al carrito:', id, nombre, precio);
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        mostrarToast('Debes iniciar sesión para agregar al carrito', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    // Obtener evento de la URL o seleccionar
    const urlParams = new URLSearchParams(window.location.search);
    const eventoIdFromUrl = urlParams.get('eventoId');
    let eventoSeleccionado = null;
    
    if (eventoIdFromUrl) {
        eventoSeleccionado = { id: eventoIdFromUrl, nombre_evento: `Evento #${eventoIdFromUrl}` };
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
            mostrarToast(`"${nombre}" agregado al carrito para el evento "${eventoSeleccionado.nombre_evento || eventoSeleccionado.nombre}"`, 'success');
            // Actualizar badge en todas las páginas
            if (window.actualizarBadge) window.actualizarBadge();
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
    
    let icono = '';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
    
    toast.innerHTML = `<span class="toast-icon">${icono}</span>${mensaje}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
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
    userMenu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    userMenu.style.left = (rect.left + window.scrollX - 100) + 'px';
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
    console.log('🚀 Servicios.js iniciado');
    actualizarBotonLogin();
    cargarServicios();
    actualizarBadge();
});

// Exponer funciones globales
window.toggleMenu = toggleMenu;
window.agregarAlCarrito = agregarAlCarrito;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;