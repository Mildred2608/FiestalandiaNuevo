// frontend/js/subcategorias.js
//const API_URL = 'http://localhost:3000/api';  // ← DESCOMENTADO

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
        console.log(' Subcategorías cargadas:', subcategorias);
        
        if (subcategorias.length === 0) {
            grid.innerHTML = '<div class="no-results">No hay subcategorías disponibles en esta categoría</div>';
            return;
        }
        
        grid.innerHTML = '';
        
        // Cargar servicios para contar
        const serviciosResponse = await fetch(`${API_URL}/servicios/publicos`);
        const servicios = await serviciosResponse.json();
        console.log(' Servicios públicos:', servicios);
        
        subcategorias.forEach(sub => {
            // Contar servicios en esta subcategoría (CORREGIDO: usar ID en lugar de nombre)
            const serviciosCount = servicios.filter(s => 
                s.subcategoria_id === sub.id
            ).length;
            
            console.log(` Subcategoría ${sub.nombre} (ID: ${sub.id}) tiene ${serviciosCount} servicios`);
            
            const card = document.createElement('div');
            card.classList.add('subcategoria-card');
            
            // CORREGIDO: Usar 'id' como parámetro, no 'subcategoria'
            card.onclick = () => {
                console.log(' Click en subcategoría ID:', sub.id, 'Nombre:', sub.nombre);
                window.location.href = `servicios.html?id=${sub.id}&nombre=${encodeURIComponent(sub.nombre)}`;
            };
            
            const imagenPorDefecto = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3';
            const tieneImagen = sub.imagen_url && sub.imagen_url.trim() !== '';
            console.log('Subcategoría:', sub.nombre, 'URL imagen:', sub.imagen_url);

            const imagenHtml = tieneImagen
                ? `
                    <img 
                        src="${sub.imagen_url}" 
                        alt="${sub.nombre}" 
                        class="subcategoria-imagen"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    >
                 `
                : '';

            const iconoHtml = `
                <div class="subcategoria-icon" ${tieneImagen ? 'style="display:none;"' : ''}></div>
            `;

            card.innerHTML = `
                ${imagenHtml}
                ${iconoHtml}
                <div class="subcategoria-info">
                    <h3>${sub.nombre}</h3>
                    <p>${sub.descripcion || 'Sin descripción'}</p>
                    <div class="subcategoria-footer">
                        <span class="subcategoria-count">${serviciosCount} servicios</span>
                        <button class="ver-servicios-btn" onclick="event.stopPropagation(); window.location.href='servicios.html?id=${sub.id}&nombre=${encodeURIComponent(sub.nombre)}'">
                            Ver servicios →
                        </button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
        
    } catch (error) {
        console.error(' Error cargando subcategorías:', error);
        grid.innerHTML = '<div class="no-results">Error al cargar las subcategorías</div>';
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

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log(' Subcategorias.js iniciado');
    actualizarBotonLogin();
    cargarSubcategorias();
    actualizarBadge();
    window.addEventListener('storage', actualizarBadge);
});

// Exponer funciones globales
window.toggleMenu = toggleMenu;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;