// frontend/js/carrito.js
//const API_URL = 'http://localhost:3000/api';

// ===== CARGAR ITEMS DEL CARRITO =====
function cargarCarrito() {
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoContenido = document.getElementById('carritoContenido');
    const carritoItems = document.getElementById('carritoItems');
    const resumenLines = document.getElementById('resumenLines');
    const totalPrecio = document.getElementById('totalPrecio');

    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('eventoId');

    if (eventoId) {
        const header = document.querySelector('header h1');
        if (header) header.textContent = `🛒 Carrito del Evento #${eventoId}`;
    }

    try {
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        const carritoFiltrado = eventoId ? carrito.filter(item => String(item.eventoId) === String(eventoId)) : carrito;

        if (carritoFiltrado.length === 0) {
            carritoVacio.style.display = 'block';
            carritoContenido.style.display = 'none';

            if (eventoId) {
                carritoVacio.innerHTML = `
                    <div class="empty-icon">🛒</div>
                    <h3>No hay servicios en el carrito para el evento #${eventoId}</h3>
                    <p>Agrega servicios desde <a href="servicios.html?eventoId=${eventoId}">Servicios</a></p>
                `;
            }

            actualizarBadge();
            return;
        }

        carritoVacio.style.display = 'none';
        carritoContenido.style.display = 'grid';

        let total = 0;
        const secciones = {};

        carritoFiltrado.forEach((item, index) => {
            const key = item.eventoId ? `evento-${item.eventoId}` : 'general';
            if (!secciones[key]) {
                secciones[key] = {
                    eventoId: item.eventoId || null,
                    eventoNombre: item.eventoNombre || 'Carrito general',
                    items: []
                };
            }
            secciones[key].items.push({ item, index });
            total += (item.precio || 0) * (item.cantidad || 1);
        });

        let itemsHtml = '';
        const selectorData = [];
        Object.values(secciones).forEach(seccion => {
            const subtotalSeccion = seccion.items.reduce((s, { item }) => s + (item.precio || 0) * (item.cantidad || 1), 0);
            selectorData.push({
                eventoId: seccion.eventoId,
                eventoNombre: seccion.eventoNombre,
                total: subtotalSeccion
            });

            itemsHtml += `<div class="carrito-evento-seccion">
                <h3>${seccion.eventoNombre}${seccion.eventoId ? ` (#${seccion.eventoId})` : ''}</h3>`;

            seccion.items.forEach(({ item, index }) => {
                const cantidad = item.cantidad || 1;
                const subtotal = item.precio * cantidad;

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
            });

            itemsHtml += '</div>';
        });

        carritoItems.innerHTML = itemsHtml;
        resumenLines.innerHTML = selectorData.map(seccion => {
            return `
                <div class="resumen-line">
                    <span class="line-name">${seccion.eventoNombre}</span>
                    <span class="line-qty">&nbsp;</span>
                    <span class="line-price">$${seccion.total.toLocaleString('es-MX')}</span>
                </div>
            `;
        }).join('');

        totalPrecio.textContent = `$${total.toLocaleString('es-MX')}`;

        populateEventoAPagar(selectorData);
        const select = document.getElementById('eventoAPagar');
        if (select) {
            select.addEventListener('change', updateEventoAPagarTotal);
        }
        actualizarBadge();

    } catch (error) {
        console.error('Error al cargar carrito:', error);
    }
}

function populateEventoAPagar(selectorData) {
    const select = document.getElementById('eventoAPagar');
    const totalLabel = document.getElementById('pagoEventoTotal');

    if (!select || !totalLabel) return;

    select.innerHTML = '';
    selectorData.forEach((evt, idx) => {
        const value = evt.eventoId ? String(evt.eventoId) : `general-${idx}`;
        const display = evt.eventoId
            ? `${evt.eventoNombre} (#${evt.eventoId}) - $${evt.total.toLocaleString('es-MX')}`
            : `${evt.eventoNombre} - $${evt.total.toLocaleString('es-MX')}`;

        const option = document.createElement('option');
        option.value = value;
        option.textContent = display;
        option.dataset.total = evt.total;
        select.appendChild(option);
    });

    if (selectorData.length > 0) {
        select.selectedIndex = 0;
        totalLabel.textContent = `Total evento seleccionado: $${Number(select.options[0].dataset.total).toLocaleString('es-MX')}`;
        updateEventoAPagarTotal(); // Update total general
    } else {
        totalLabel.textContent = 'Total evento seleccionado: $0';
    }
}

function updateEventoAPagarTotal() {
    const select = document.getElementById('eventoAPagar');
    const totalLabel = document.getElementById('pagoEventoTotal');
    const totalPrecio = document.getElementById('totalPrecio');
    if (!select || !totalLabel || !totalPrecio) return;
    const selected = select.options[select.selectedIndex];
    const total = Number(selected.dataset.total || 0);
    totalLabel.textContent = `Total evento seleccionado: $${total.toLocaleString('es-MX')}`;
    totalPrecio.textContent = `$${total.toLocaleString('es-MX')}`;
}

function abrirModalPagoEvento() {
    const select = document.getElementById('eventoAPagar');
    const totalLabel = document.getElementById('pagoEventoTotal');
    if (!select || select.options.length === 0) {
        mostrarToast('No hay eventos con saldo para pagar', 'warning');
        return;
    }

    const selected = select.options[select.selectedIndex];
    const total = Number(selected.dataset.total || 0);
    if (total <= 0) {
        mostrarToast('No hay monto para pagar en este evento.', 'info');
        return;
    }

    const modal = document.getElementById('modalPagoEvento');
    const info = document.getElementById('pagoModalEventoInfo');
    if (modal && info) {
        info.textContent = `Evento: ${selected.textContent} - Total: $${total.toLocaleString('es-MX')}`;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModalPagoEvento() {
    const modal = document.getElementById('modalPagoEvento');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function enviarSolicitudPago(event) {
    event.preventDefault();

    const select = document.getElementById('eventoAPagar');
    if (!select || select.options.length === 0) return;

    const selected = select.options[select.selectedIndex];
    const eventoId = selected.value;
    const total = Number(selected.dataset.total || 0);

    const tarjetaNumero = document.getElementById('tarjetaNumero').value.replace(/\s+/g, '');
    const tarjetaNombre = document.getElementById('tarjetaNombre').value.trim();
    const tarjetaExp = document.getElementById('tarjetaExp').value.trim();
    const tarjetaCvv = document.getElementById('tarjetaCvv').value.trim();

    if (!tarjetaNumero || tarjetaNumero.length < 13 || tarjetaNumero.length > 19 || !/^\d+$/.test(tarjetaNumero)) {
        mostrarToast('Ingresa un número de tarjeta válido', 'error');
        return;
    }
    if (!tarjetaNombre) {
        mostrarToast('Ingresa el nombre de la tarjeta', 'error');
        return;
    }
    if (!tarjetaExp || !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(tarjetaExp)) {
        mostrarToast('Ingresa fecha de expiración válida MM/AA', 'error');
        return;
    }
    if (!tarjetaCvv || tarjetaCvv.length < 3 || tarjetaCvv.length > 4 || !/^\d+$/.test(tarjetaCvv)) {
        mostrarToast('Ingresa CVV válido', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        mostrarToast('Debes iniciar sesión para pagar', 'warning');
        return;
    }

    const payload = {
        evento_id: eventoId,
        total: total,
        tarjeta_ultimos4: tarjetaNumero.slice(-4),
        tarjeta_nombre: tarjetaNombre
    };

    try {
        const response = await fetch(`${API_URL}/admin/cliente/pagos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error al enviar solicitud de pago');
        }

        mostrarToast('Solicitud de pago enviada correctamente. Su pago será aprobado en un máximo de 48 horas.', 'success');
        cerrarModalPagoEvento();

        // Eliminar los items pagados de ese evento en carrito local
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        const restante = carrito.filter(item => String(item.eventoId) !== String(eventoId));
        localStorage.setItem('fiestalandia_carrito', JSON.stringify(restante));
        cargarCarrito();

    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message || 'Error en solicitud de pago', 'error');
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
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('eventoId');

    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        if (eventoId) {
            const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
            const restante = carrito.filter(item => String(item.eventoId) !== String(eventoId));
            localStorage.setItem('fiestalandia_carrito', JSON.stringify(restante));
            mostrarToast(`Carrito del evento #${eventoId} vaciado`, 'info');
        } else {
            localStorage.removeItem('fiestalandia_carrito');
            mostrarToast('Carrito vaciado', 'info');
        }
        cargarCarrito();
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
    const select = document.getElementById('eventoAPagar');
    const button = document.getElementById('btnPagarEvento');
    const closeModal = document.getElementById('closeModalPago');
    const formPago = document.getElementById('formPagoEvento');
    
    if (select) select.addEventListener('change', updateEventoAPagarTotal);
    if (button) button.addEventListener('click', abrirModalPagoEvento);
    if (closeModal) closeModal.addEventListener('click', cerrarModalPagoEvento);
    if (formPago) formPago.addEventListener('submit', enviarSolicitudPago);

    // Cerrar modal con click fuera del contenido
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modalPagoEvento');
        if (modal && e.target === modal) {
            cerrarModalPagoEvento();
        }
    });
});

// Exponer funciones globales
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.vaciarCarrito = vaciarCarrito;
window.abrirModalPagoEvento = abrirModalPagoEvento;
window.toggleMenu = toggleMenu;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;