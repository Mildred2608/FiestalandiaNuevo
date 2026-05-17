// frontend/js/subcategorias.js
//const API_URL = 'http://localhost:3000/api';

// Obtener el ID de la categoría de la URL
const urlParams = new URLSearchParams(window.location.search);
const categoriaId = urlParams.get('id');
const categoriaNombre = urlParams.get('nombre');

// ===== CARGAR SUBCATEGORÍAS =====
async function cargarSubcategorias() {
    const grid = document.getElementById('subcategoriasGrid');
    const titulo = document.getElementById('categoriaTitulo');
    const descripcion = document.getElementById('categoriaDescripcion');
    
    if (!categoriaId) {
        window.location.href = 'index.html';
        return;
    }
    
    titulo.textContent = `Cargando ${categoriaNombre || ''}...`;
    
    try {
        // Cargar información de la categoría
        const catResponse = await fetch(`${API_URL}/categorias`);
        const categorias = await catResponse.json();
        const categoria = categorias.find(c => c.id == categoriaId);
        
        if (categoria) {
            titulo.textContent = categoria.nombre;
            descripcion.textContent = categoria.descripcion || 'Selecciona una subcategoría para ver los servicios disponibles';
        }
        
        // Cargar subcategorías
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const response = await fetch(`${API_URL}/subcategorias/categoria/${categoriaId}`, {
            headers: headers
        });
        
        const subcategorias = await response.json();
        
        if (subcategorias.length === 0) {
            grid.innerHTML = '<div class="no-results">No hay subcategorías disponibles en esta categoría</div>';
            return;
        }
        
        // Cargar servicios para contar
        const serviciosResponse = await fetch(`${API_URL}/servicios/publicos`);
        const servicios = await serviciosResponse.json();
        
        grid.innerHTML = '';
        
        subcategorias.forEach(sub => {
            const serviciosCount = servicios.filter(s => s.subcategoria_id === sub.id).length;
            
            const card = document.createElement('div');
            card.classList.add('subcategoria-card');
            
            card.onclick = () => {
                window.location.href = `servicios.html?id=${sub.id}&nombre=${encodeURIComponent(sub.nombre)}`;
            };
            
            // Construir imagen si existe
            let imagenHtml = '';
            if (sub.imagen_url && sub.imagen_url.trim() !== '') {
                let src = sub.imagen_url;
                if (src.startsWith('/uploads')) {
                    const baseUrl = API_URL.replace('/api', '');
                    src = `${baseUrl}${src}`;
                }
                
                imagenHtml = `
                    <img 
                        src="${src}" 
                        alt="${sub.nombre}" 
                        class="subcategoria-imagen"
                        onerror="this.style.display='none'"
                    >
                `;
            }
            
            card.innerHTML = `
                ${imagenHtml}
                <div class="subcategoria-info">
                    <h3>${escapeHtml(sub.nombre)}</h3>
                    <p>${escapeHtml(sub.descripcion || 'Sin descripción')}</p>
                    <div class="subcategoria-footer">
                        <span class="subcategoria-count">${serviciosCount} ${serviciosCount === 1 ? 'servicio' : 'servicios'}</span>
                        <button class="ver-servicios-btn" onclick="event.stopPropagation(); window.location.href='servicios.html?id=${sub.id}&nombre=${encodeURIComponent(sub.nombre)}'">
                            Ver servicios →
                        </button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error cargando subcategorías:', error);
        grid.innerHTML = '<div class="no-results">Error al cargar las subcategorías</div>';
    }
}

// Helper para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

// ===== MENÚ DE USUARIO =====
function mostrarMenuUsuario(user) {

    // Eliminar menú anterior si existe
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) existingMenu.remove();

    // Validación segura de roles
    const roles = Array.isArray(user.roles)
        ? user.roles
        : [user.rol].filter(Boolean);

    // ===== MENÚ GENERAL =====
    let menuContent = `
        <div class="user-menu-header">
            <strong>${user.nombre}</strong>
            <small>${user.email}</small>
        </div>

        <div class="user-menu-items">

            <a href="perfil.html">👤 Mi Perfil</a>

            <a href="mis-eventos.html">
                📅 Mis Eventos
            </a>

            <a href="mis-cotizaciones.html">
                💰 Mis Cotizaciones
            </a>
    `;

    // ===== FUNCIONES DE PROVEEDOR =====
    if (roles.includes('proveedor')) {

        menuContent += `

            <hr>

            <div class="menu-section-title">
                💼 PANEL PROVEEDOR
            </div>

            <a href="proveedor.html"
               class="menu-proveedor">
               🏢 Panel Proveedor
            </a>

            <a href="mis-solicitudes-servicio.html">
                📦 Mis Servicios
            </a>
        `;

    } else {

        menuContent += `

            <hr>

            <a href="solicitar-registro-servicio.html"
               class="menu-solicitar">

               📋 Registrar mi servicio

            </a>

            <a href="mis-solicitudes-servicio.html"
               class="menu-solicitudes">

               📋 Estado de solicitudes

            </a>
        `;
    }

    // ===== PANEL ADMIN =====
    if (roles.includes('admin')) {

        menuContent += `

            <hr>

            <div class="menu-section-title">
                👑 ADMINISTRACIÓN
            </div>

            <a href="admin.html">
                👑 Panel Admin
            </a>
        `;
    }

    // ===== CERRAR MENÚ =====
    menuContent += `

            <hr>

            <a href="#"
               onclick="cerrarSesion()"
               style="color: #dc3545; font-weight: 600;">

               🚪 Cerrar Sesión

            </a>

        </div>
    `;

    // ===== CREAR MENÚ =====
    const userMenu = document.createElement('div');

    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu';
    userMenu.innerHTML = menuContent;

    document.body.appendChild(userMenu);

    // ===== POSICIÓN =====
    const loginBtn = document.getElementById('loginBtn');

    const rect = loginBtn.getBoundingClientRect();

    userMenu.style.top =
        (rect.bottom + window.scrollY + 5) + 'px';

    userMenu.style.left =
        (rect.left + window.scrollX - 120) + 'px';

    userMenu.style.display = 'block';

    // ===== CERRAR AL HACER CLICK FUERA =====
    setTimeout(() => {

        document.addEventListener('click', function cerrarMenu(e) {

            if (
                !userMenu.contains(e.target) &&
                e.target !== loginBtn
            ) {

                userMenu.remove();

                document.removeEventListener(
                    'click',
                    cerrarMenu
                );
            }
        });

    }, 100);
}

// ===== PERFIL =====
function verPerfil() {

    const menu = document.getElementById('userMenu');

    if (menu) menu.remove();

    window.location.href = "perfil.html";
}

// ===== CERRAR SESIÓN =====
function cerrarSesion() {

    auth.logout();

    window.location.reload();
}

// ===== MENÚ MÓVIL =====
function toggleMenu() {

    const menu = document.getElementById('navMenu');

    const hamburger =
        document.getElementById('hamburger');

    menu.classList.toggle('active');

    hamburger.classList.toggle('active');
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

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    actualizarBotonLogin();
    cargarSubcategorias();
    actualizarBadge();
    window.addEventListener('storage', actualizarBadge);
});

// Exponer funciones globales
window.toggleMenu = toggleMenu;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;