// frontend/js/admin-header.js
document.addEventListener('DOMContentLoaded', () => {
    inyectarAdminHeader();
});

function inyectarAdminHeader() {
    // Buscar si existe el contenedor donde inyectar, sino buscar <nav>
    let navElement = document.getElementById('admin-navbar');
    if (!navElement) {
        navElement = document.querySelector('nav');
    }

    if (!navElement) return; // Si no hay nav, no hacemos nada

    // Determinar si es la página principal del admin
    const esAdminPrincipal = window.location.pathname.endsWith('admin.html');
    const linkVolver = esAdminPrincipal 
        ? '<a href="index.html">← Volver a la Tienda</a>' 
        : '<a href="admin.html">← Volver al panel</a>';

    const headerHtml = `
        <div class="nav-container">
            <div class="logo">
                <a href="admin.html" style="color: inherit; text-decoration: none;">Fiestalandia Admin</a>
            </div>
            <div class="menu">
                ${linkVolver}
                ${!esAdminPrincipal ? '<a href="index.html">Inicio</a>' : ''}
                <a href="#" class="btn-login" id="adminMenuBtn">👤 Administrador</a>
            </div>
        </div>
    `;

    // Reemplazamos el contenido de la barra de navegación
    navElement.innerHTML = headerHtml;

    // Obtenemos los datos del usuario actual si existe
    const user = auth && typeof auth.getCurrentUser === 'function' ? auth.getCurrentUser() : null;

    // Configurar el botón del administrador
    const btnMenu = document.getElementById('adminMenuBtn');
    if (btnMenu) {
        if (user) {
            btnMenu.innerHTML = `👤 ${user.nombre}`;
            btnMenu.classList.add('logged-in'); // Mismo comportamiento que main.js
        } else {
            // Si por alguna razón no hay sesión o falló la recuperación en admin
            btnMenu.innerHTML = '👤 Admin';
        }
        
        btnMenu.onclick = (e) => {
            e.preventDefault();
            mostrarMenuAdmin(user || { nombre: 'Administrador', email: 'admin@fiestalandia.com', rol: 'admin' });
        };
    }
}

function mostrarMenuAdmin(user) {
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) {
        existingMenu.remove(); // Si ya existe y lo volvemos a clickear, toggle (lo cerramos)
        return; 
    }
    
    let menuContent = `
        <div class="user-menu-header">
            <strong>${user.nombre}</strong>
            <small>${user.email}</small>
        </div>
        <div class="user-menu-items">
            <a href="#" onclick="verPerfilAdmin()">👤 Mi Perfil</a>
            <a href="admin.html">👑 Panel Admin</a>
            <a href="admin-clientes.html">👥 Clientes</a>
            <a href="admin-proveedores.html">🏢 Proveedores</a>
            <a href="admin-cotizaciones.html">📊 Cotizaciones</a>
            <a href="admin-eventos.html">📅 Eventos</a>
            <a href="admin-solicitudes.html">📋 Solicitudes de Registro</a>
            <hr>
            <a href="#" onclick="cerrarSesionAdmin()" style="color: #dc3545;">🚪 Cerrar Sesión</a>
        </div>
    `;
    
    const userMenu = document.createElement('div');
    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu'; // Mismos estilos que main.js
    userMenu.innerHTML = menuContent;
    document.body.appendChild(userMenu);
    
    const btnMenu = document.getElementById('adminMenuBtn');
    const rect = btnMenu.getBoundingClientRect();
    
    // Posicionamiento idéntico al que se usa en main.js
    userMenu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    userMenu.style.left = (rect.left + window.scrollX - 100) + 'px';
    userMenu.style.display = 'block';
    
    // Cerrar el menú haciendo clic afuera
    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu(e) {
            if (!userMenu.contains(e.target) && e.target !== btnMenu) {
                userMenu.style.display = 'none';
                userMenu.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        });
    }, 100);

    // Cerrar con Escape
    document.addEventListener('keydown', function letEscapeClose(e) {
        if (e.key === 'Escape') {
            userMenu.style.display = 'none';
            userMenu.remove();
            document.removeEventListener('keydown', letEscapeClose);
        }
    });
}

function verPerfilAdmin() {
    const user = auth && typeof auth.getCurrentUser === 'function' ? auth.getCurrentUser() : {nombre: 'Admin', email: '', telefono: ''};
    alert(`👤 ${user.nombre}\\n📧 ${user.email}\\n📱 ${user.telefono || 'No especificado'}`);
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.style.display = 'none';
        menu.remove();
    }
}

function cerrarSesionAdmin() {
    if (auth && typeof auth.logout === 'function') {
        auth.logout();
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
    window.location.href = 'index.html';
}
