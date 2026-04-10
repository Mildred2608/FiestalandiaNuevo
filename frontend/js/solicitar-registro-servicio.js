// frontend/js/solicitar-registro-servicio.js
//const API_URL = 'http://localhost:3000/api';  // ← DESCOMENTAR

// ===== CARGAR CATEGORÍAS =====
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/categorias`);
        const categorias = await response.json();
        
        const select = document.getElementById('categoria');
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// ===== CARGAR SUBCATEGORÍAS POR CATEGORÍA =====
async function cargarSubcategorias(categoriaId) {
    try {
        const response = await fetch(`${API_URL}/subcategorias/categoria/${categoriaId}`);
        const subcategorias = await response.json();
        
        const select = document.getElementById('subcategoria');
        select.innerHTML = '<option value="">Seleccionar subcategoría...</option>';
        
        subcategorias.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.id;
            option.textContent = sub.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar subcategorías:', error);
    }
}

// ===== ENVIAR SOLICITUD =====
async function enviarSolicitud(event) {
    event.preventDefault();
    
    // Validar que el usuario esté autenticado
    const user = auth.getCurrentUser();
    if (!user) {
        mostrarToast('Debes iniciar sesión para enviar una solicitud', 'warning');
        document.getElementById('authModal').style.display = 'flex';
        return;
    }

    // Recopilar datos
    const solicitud = {
        cliente_id: user.id,
        categoria_id: document.getElementById('categoria').value,
        subcategoria_id: document.getElementById('subcategoria').value || null,
        nueva_subcategoria: document.getElementById('nuevaSubcategoria').value || null,
        nombre_servicio: document.getElementById('nombreServicio').value,
        descripcion: document.getElementById('descripcion').value,
        precio_propuesto: document.getElementById('precio').value,
        moneda: document.getElementById('moneda').value,
        proveedor_nombre: document.getElementById('proveedorNombre').value,
        proveedor_email: document.getElementById('proveedorEmail').value,
        proveedor_telefono: document.getElementById('proveedorTelefono').value,
        proveedor_whatsapp: document.getElementById('proveedorWhatsapp').value || null,
        proveedor_direccion: document.getElementById('proveedorDireccion').value || null,
        sitio_web: document.getElementById('sitioWeb').value || null,
        imagenes: document.getElementById('imagenes').value || null,
        comentarios: document.getElementById('comentarios').value || null
    };

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/solicitudes/nuevo-servicio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(solicitud)
        });

        if (response.ok) {
            mostrarToast('Solicitud enviada exitosamente', 'success');
            document.getElementById('formSolicitudRegistro').reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            const error = await response.json();
            mostrarToast(error.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error al enviar solicitud', 'error');
    }
}

// ===== FORMATO DE TELÉFONO =====
function formatearTelefono(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        
        if (value.length > 6) {
            e.target.value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6);
        } else if (value.length > 3) {
            e.target.value = value.slice(0, 3) + '-' + value.slice(3);
        } else {
            e.target.value = value;
        }
    });
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
            <a href="perfil.html">👤 Mi Perfil</a>
            <a href="mis-eventos.html">📅 Mis Eventos</a>
            <a href="mis-cotizaciones.html">💰 Mis Cotizaciones</a>
            <a href="solicitar-registro-servicio.html" class="menu-solicitar">📋 Registrar mi servicio</a>
            <a href="mis-solicitudes-servicio.html" class="menu-solicitudes">📋 Mis solicitudes</a>
    `;
    
    if (user.rol === 'admin') {
        menuContent += `
            <a href="admin.html">👑 Panel Admin</a>
        `;
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

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Solicitar Registro de Servicio iniciado');
    
    actualizarBotonLogin();
    cargarCategorias();
    
    // Event listeners
    document.getElementById('categoria').addEventListener('change', (e) => {
        if (e.target.value) {
            cargarSubcategorias(e.target.value);
        }
    });
    
    document.getElementById('formSolicitudRegistro').addEventListener('submit', enviarSolicitud);
    
    // Formatear teléfonos
    formatearTelefono(document.getElementById('proveedorTelefono'));
    if (document.getElementById('proveedorWhatsapp')) {
        formatearTelefono(document.getElementById('proveedorWhatsapp'));
    }
    
    actualizarBadge();
});

// Exponer funciones globales
window.toggleMenu = toggleMenu;