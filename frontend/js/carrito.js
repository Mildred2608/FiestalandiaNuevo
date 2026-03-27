// frontend/js/carrito.js
//const API_URL = 'http://localhost:3000/api';

// ===== VARIABLES GLOBALES =====
let carritoLocal = []; // Backup para usuarios no autenticados

// ===== CARGAR ITEMS DEL CARRITO =====
async function cargarCarrito() {
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
        // Verificar si usuario está autenticado
        const token = localStorage.getItem('token');
        let carrito = [];

        if (token) {
            // Usuario autenticado: cargar desde BD
            const response = await fetch(`${API_URL}/carrito`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                carrito = await response.json();
                // Guardar copia en localStorage como respaldo
                localStorage.setItem('fiestalandia_carrito', JSON.stringify(carrito));
            } else {
                throw new Error('Error al cargar carrito');
            }
        } else {
            // Usuario no autenticado: cargar desde localStorage
            carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        }

        carritoLocal = carrito;
        
        // Filtrar por evento si es necesario
        const carritoFiltrado = eventoId ? carrito.filter(item => String(item.evento_id) === String(eventoId)) : carrito;

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
            const key = item.evento_id ? `evento-${item.evento_id}` : 'general';
            if (!secciones[key]) {
                secciones[key] = {
                    eventoId: item.evento_id || null,
                    eventoNombre: item.evento_nombre || 'Carrito general',
                    items: []
                };
            }
            secciones[key].items.push({ item, originalIndex: index, id: item.id });
            total += (item.precio || 0) * (item.cantidad || 1);
        });

        let itemsHtml = '';
        const selectorData = [];
        
        for (const [key, seccion] of Object.entries(secciones)) {
            const subtotalSeccion = seccion.items.reduce((s, { item }) => s + (item.precio || 0) * (item.cantidad || 1), 0);
            selectorData.push({
                eventoId: seccion.eventoId,
                eventoNombre: seccion.eventoNombre,
                total: subtotalSeccion
            });

            itemsHtml += `<div class="carrito-evento-seccion">
                <h3>${seccion.eventoNombre}${seccion.eventoId ? ` (#${seccion.eventoId})` : ''}</h3>`;

            for (const { item, id } of seccion.items) {
                const cantidad = item.cantidad || 1;
                const subtotal = item.precio * cantidad;

                itemsHtml += `
                    <div class="carrito-item" data-id="${id}">
                        <div class="item-icon">🎯</div>
                        <div class="item-info">
                            <h4>${item.nombre}</h4>
                            <p>${item.descripcion || 'Sin descripción'}</p>
                            <div class="item-price">$${item.precio.toLocaleString('es-MX')}</div>
                        </div>
                        <div class="item-controls">
                            <button class="qty-btn" onclick="cambiarCantidad(${id}, -1)">−</button>
                            <span class="qty-value">${cantidad}</span>
                            <button class="qty-btn" onclick="cambiarCantidad(${id}, 1)">+</button>
                            <button class="btn-remove" onclick="eliminarDelCarrito(${id})" title="Eliminar">🗑️</button>
                        </div>
                    </div>
                `;
            }

            itemsHtml += '</div>';
        }

        carritoItems.innerHTML = itemsHtml;
        resumenLines.innerHTML = selectorData.map(seccion => `
            <div class="resumen-line">
                <span class="line-name">${seccion.eventoNombre}</span>
                <span class="line-qty">&nbsp;</span>
                <span class="line-price">$${seccion.total.toLocaleString('es-MX')}</span>
            </div>
        `).join('');

        totalPrecio.textContent = `$${total.toLocaleString('es-MX')}`;

        populateEventoAPagar(selectorData);
        const select = document.getElementById('eventoAPagar');
        if (select) {
            select.addEventListener('change', updateEventoAPagarTotal);
        }
        actualizarBadge();

    } catch (error) {
        console.error('Error al cargar carrito:', error);
        // Fallback a localStorage
        cargarCarritoLocal();
    }
}

// ===== CARGA LOCAL (fallback) =====
function cargarCarritoLocal() {
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoContenido = document.getElementById('carritoContenido');
    const carritoItems = document.getElementById('carritoItems');
    const resumenLines = document.getElementById('resumenLines');
    const totalPrecio = document.getElementById('totalPrecio');

    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('eventoId');

    try {
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        const carritoFiltrado = eventoId ? carrito.filter(item => String(item.eventoId) === String(eventoId)) : carrito;

        if (carritoFiltrado.length === 0) {
            carritoVacio.style.display = 'block';
            carritoContenido.style.display = 'none';
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

        for (const [key, seccion] of Object.entries(secciones)) {
            const subtotalSeccion = seccion.items.reduce((s, { item }) => s + (item.precio || 0) * (item.cantidad || 1), 0);
            selectorData.push({
                eventoId: seccion.eventoId,
                eventoNombre: seccion.eventoNombre,
                total: subtotalSeccion
            });

            itemsHtml += `<div class="carrito-evento-seccion">
                <h3>${seccion.eventoNombre}${seccion.eventoId ? ` (#${seccion.eventoId})` : ''}</h3>`;

            for (const { item, index } of seccion.items) {
                const cantidad = item.cantidad || 1;
                itemsHtml += `
                    <div class="carrito-item" data-index="${index}">
                        <div class="item-icon">🎯</div>
                        <div class="item-info">
                            <h4>${item.nombre}</h4>
                            <p>${item.descripcion || 'Sin descripción'}</p>
                            <div class="item-price">$${item.precio.toLocaleString('es-MX')}</div>
                        </div>
                        <div class="item-controls">
                            <button class="qty-btn" onclick="cambiarCantidadLocal(${index}, -1)">−</button>
                            <span class="qty-value">${cantidad}</span>
                            <button class="qty-btn" onclick="cambiarCantidadLocal(${index}, 1)">+</button>
                            <button class="btn-remove" onclick="eliminarDelCarritoLocal(${index})" title="Eliminar">🗑️</button>
                        </div>
                    </div>
                `;
            }
            itemsHtml += '</div>';
        }

        carritoItems.innerHTML = itemsHtml;
        resumenLines.innerHTML = selectorData.map(seccion => `
            <div class="resumen-line">
                <span class="line-name">${seccion.eventoNombre}</span>
                <span class="line-qty">&nbsp;</span>
                <span class="line-price">$${seccion.total.toLocaleString('es-MX')}</span>
            </div>
        `).join('');

        totalPrecio.textContent = `$${total.toLocaleString('es-MX')}`;
        populateEventoAPagar(selectorData);
        
        const select = document.getElementById('eventoAPagar');
        if (select) select.addEventListener('change', updateEventoAPagarTotal);
        
        actualizarBadge();

    } catch (error) {
        console.error('Error al cargar carrito local:', error);
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
        updateEventoAPagarTotal();
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

// ===== FUNCIONES PARA USUARIOS AUTENTICADOS (BD) =====

async function cambiarCantidad(id, cambio) {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            // Obtener item actual
            const response = await fetch(`${API_URL}/carrito`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const carrito = await response.json();
            const item = carrito.find(i => i.id === id);
            
            if (item) {
                const nuevaCantidad = (item.cantidad || 1) + cambio;
                if (nuevaCantidad < 1) return;
                
                await fetch(`${API_URL}/carrito/actualizar/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ cantidad: nuevaCantidad })
                });
                
                cargarCarrito();
            }
        } catch (error) {
            console.error('Error:', error);
            // Fallback a localStorage
            const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
            const itemIndex = carrito.findIndex(i => i.id === id);
            if (itemIndex !== -1) {
                carrito[itemIndex].cantidad = (carrito[itemIndex].cantidad || 1) + cambio;
                if (carrito[itemIndex].cantidad < 1) carrito[itemIndex].cantidad = 1;
                localStorage.setItem('fiestalandia_carrito', JSON.stringify(carrito));
                cargarCarrito();
            }
        }
    } else {
        cambiarCantidadLocal(id, cambio);
    }
}

async function eliminarDelCarrito(id) {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            const response = await fetch(`${API_URL}/carrito/eliminar/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                mostrarToast('Servicio eliminado del carrito', 'success');
                cargarCarrito();
            }
        } catch (error) {
            console.error('Error:', error);
            // Fallback a localStorage
            const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
            const itemIndex = carrito.findIndex(i => i.id === id);
            if (itemIndex !== -1) {
                const item = carrito[itemIndex];
                carrito.splice(itemIndex, 1);
                localStorage.setItem('fiestalandia_carrito', JSON.stringify(carrito));
                mostrarToast(`"${item.nombre}" eliminado del carrito`, 'success');
                cargarCarrito();
            }
        }
    } else {
        eliminarDelCarritoLocal(id);
    }
}

async function vaciarCarrito() {
    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('eventoId');

    if (!confirm('¿Estás seguro de vaciar el carrito?')) return;

    if (token) {
        try {
            let url = `${API_URL}/carrito/vaciar`;
            if (eventoId) {
                url += `?evento_id=${eventoId}`;
            }
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                mostrarToast(eventoId ? `Carrito del evento vaciado` : 'Carrito vaciado', 'info');
                cargarCarrito();
            }
        } catch (error) {
            console.error('Error:', error);
            // Fallback a localStorage
            vaciarCarritoLocal();
        }
    } else {
        vaciarCarritoLocal();
    }
}

// ===== FUNCIONES PARA USUARIOS NO AUTENTICADOS (localStorage) =====

function cambiarCantidadLocal(index, cambio) {
    try {
        const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
        
        if (carrito[index]) {
            carrito[index].cantidad = (carrito[index].cantidad || 1) + cambio;
            if (carrito[index].cantidad < 1) carrito[index].cantidad = 1;
            localStorage.setItem('fiestalandia_carrito', JSON.stringify(carrito));
            cargarCarrito();
        }
    } catch (error) {
        console.error('Error al cambiar cantidad:', error);
    }
}

function eliminarDelCarritoLocal(index) {
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

function vaciarCarritoLocal() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventoId = urlParams.get('eventoId');

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

// ===== FUNCIONES DE PAGO (sin cambios) =====
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

        // Vaciar carrito del evento pagado en BD
        await fetch(`${API_URL}/carrito/vaciar?evento_id=${eventoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        cargarCarrito();

    } catch (error) {
        console.error('Error:', error);
        mostrarToast(error.message || 'Error en solicitud de pago', 'error');
    }
}

// ===== SOLICITAR COTIZACIÓN =====
async function solicitarCotizacion() {
    const user = auth.getCurrentUser();
    if (!user) {
        mostrarToast('🔐 Inicia sesión para solicitar una cotización', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/carrito/cotizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarToast(`✅ Cotización #${data.cotizacion_id} generada. Total: $${data.total.toLocaleString('es-MX')}`, 'success');
            cargarCarrito(); // Recargar carrito (vacío)
            actualizarBadge(); // Actualizar badge
        } else {
            mostrarToast(data.message || 'Error al generar cotización', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al generar cotización', 'error');
    }
}

// ===== ACTUALIZAR BADGE DEL CARRITO (CANTIDAD) =====
async function actualizarBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            // USAR /cantidad, NO /total
            const response = await fetch(`${API_URL}/carrito/cantidad`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            badge.textContent = data.total || 0;
            badge.style.display = (data.total > 0) ? 'inline-block' : 'none';
        } catch (error) {
            console.error('Error al obtener cantidad:', error);
            try {
                const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
                const total = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
                badge.textContent = total;
                badge.style.display = total > 0 ? 'inline-block' : 'none';
            } catch (e) {
                badge.style.display = 'none';
            }
        }
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
    if (tipo === 'info') icono = '📌';
    
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
    console.log('🚀 Carrito.js iniciado');
    
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

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modalPagoEvento');
        if (modal && e.target === modal) {
            cerrarModalPagoEvento();
        }
    });
    
    // Escuchar cambios en localStorage (para sincronizar entre pestañas)
    window.addEventListener('storage', () => {
        cargarCarrito();
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
window.solicitarCotizacion = solicitarCotizacion;