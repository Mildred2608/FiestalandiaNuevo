// frontend/js/carrito.js
//const API_URL = 'http://localhost:3000/api';

// ===== CARGAR ITEMS DEL CARRITO =====
function cargarCarrito() {
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoContenido = document.getElementById('carritoContenido');
    const carritoItems = document.getElementById('carritoItems');
    const resumenLines = document.getElementById('resumenLines');
    const totalPrecio = document.getElementById('totalPrecio');

    try {
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        
        if (carrito.length === 0) {
            carritoVacio.style.display = 'block';
            carritoContenido.style.display = 'none';
            actualizarBadge();
            return;
        }

        carritoVacio.style.display = 'none';
        carritoContenido.style.display = 'grid';

        // Generar items del carrito
        let itemsHtml = '';
        let resumenHtml = '';
        let total = 0;

        carrito.forEach((item, index) => {
            const cantidad = item.cantidad || 1;
            const subtotal = item.precio * cantidad;
            total += subtotal;

            itemsHtml += `
                <div class="carrito-item" data-index="${index}">
                    <div class="item-icon"></div>
                    <div class="item-info">
                        <h4>${item.nombre}</h4>
                        <p>${item.descripcion || 'Sin descripción'}</p>
                        <div class="item-price">$${item.precio.toLocaleString('es-MX')}</div>
                    </div>
                    <div class="item-controls">
                        <button class="qty-btn" onclick="cambiarCantidad(${index}, -1)">−</button>
                        <span class="qty-value">${cantidad}</span>
                        <button class="qty-btn" onclick="cambiarCantidad(${index}, 1)">+</button>
                        <button class="btn-remove" onclick="eliminarDelCarrito(${index})" title="Eliminar"></button>
                    </div>
                </div>
            `;

            resumenHtml += `
                <div class="resumen-line">
                    <span class="line-name">${item.nombre}</span>
                    <span class="line-qty">x${cantidad}</span>
                    <span class="line-price">$${subtotal.toLocaleString('es-MX')}</span>
                </div>
            `;
        });

        carritoItems.innerHTML = itemsHtml;
        resumenLines.innerHTML = resumenHtml;
        totalPrecio.textContent = `$${total.toLocaleString('es-MX')}`;

        actualizarBadge();

    } catch (error) {
        console.error('Error al cargar carrito:', error);
    }
}

// ===== CAMBIAR CANTIDAD =====
function cambiarCantidad(index, cambio) {
    try {
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        
        if (carrito[index]) {
            carrito[index].cantidad = (carrito[index].cantidad || 1) + cambio;
            
            if (carrito[index].cantidad < 1) {
                carrito[index].cantidad = 1;
            }
            
            localStorage.setItem('fiestalandia_carrito', JSON.stringify(carrito));
            cargarCarrito();
        }
    } catch (error) {
        console.error('Error al cambiar cantidad:', error);
    }
}

// ===== ELIMINAR DEL CARRITO =====
function eliminarDelCarrito(index) {
    try {
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        const itemEliminado = carrito[index];
        carrito.splice(index, 1);
        localStorage.setItem('fiestalandia_carrito', JSON.stringify(carrito));
        cargarCarrito();
        mostrarToast(`"${itemEliminado.nombre}" eliminado del carrito`, 'success');
    } catch (error) {
        console.error('Error al eliminar:', error);
    }
}

// ===== VACIAR CARRITO =====
function vaciarCarrito() {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        localStorage.removeItem('fiestalandia_carrito');
        cargarCarrito();
        mostrarToast(' Carrito vaciado', 'info');
    }
}

// ===== SOLICITAR COTIZACIÓN =====
function solicitarCotizacion() {
    const user = auth.getCurrentUser();
    if (!user) {
        mostrarToast('🔐 Inicia sesión para solicitar una cotización', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
    if (carrito.length === 0) {
        mostrarToast('🛒 El carrito está vacío', 'warning');
        return;
    }
    
    mostrarToast(' Función de cotización en desarrollo', 'info');
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

// ===== TOAST =====
function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast', tipo);
    
    let icono = '📌';
    if (tipo === 'success');
    if (tipo === 'error');
    if (tipo === 'warning');
    
    toast.innerHTML = `<span class="toast-icon">${icono}</span>${mensaje}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2800);
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
    alert(`👤 ${user.nombre}\n ${user.email}\n ${user.telefono || 'No especificado'}`);
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
    console.log(' Carrito.js iniciado');
    
    // Verificar si hay botón de login en esta página
    if (document.getElementById('loginBtn')) {
        actualizarBotonLogin();
    }
    
    cargarCarrito();
});

// Exponer funciones globales
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.vaciarCarrito = vaciarCarrito;
window.solicitarCotizacion = solicitarCotizacion;
window.toggleMenu = toggleMenu;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;