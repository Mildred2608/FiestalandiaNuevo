// frontend/js/main.js
//const API_URL = 'http://localhost:3000/api';

// Variables globales
let categoriasCache = [];

// ===== FUNCIONES PARA CARGAR CATEGORÍAS =====
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/categorias`);
        if (!response.ok) throw new Error('Error al cargar categorías');
        categoriasCache = await response.json();
        return categoriasCache;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// ===== FUNCIÓN PRINCIPAL - REDIRIGIR A SUBCATEGORÍAS =====
function irASubcategorias(categoriaId, categoriaNombre) {
    window.location.href = `subcategorias.html?id=${categoriaId}&nombre=${encodeURIComponent(categoriaNombre)}`;
}

// ===== ACTUALIZAR CARDS DE INICIO =====
async function actualizarCardsInicio() {
    const cardsContainer = document.querySelector('.cards');
    if (!cardsContainer) return;

    try {
        const categorias = await cargarCategorias();
        
        if (categorias.length === 0) {
            cardsContainer.innerHTML = '<p class="no-data">No hay categorías disponibles</p>';
            return;
        }

        cardsContainer.innerHTML = '';

        categorias.forEach(cat => {
            const card = document.createElement('div');
            card.classList.add('card');
            
            const imagenHtml = cat.imagen_url 
                ? `<img src="${cat.imagen_url}" alt="${cat.nombre}" class="card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`
                : '';
            
            const iconoHtml = `<div class="card-icon" ${cat.imagen_url ? 'style="display:none;"' : ''}>📁</div>`;
            
            card.innerHTML = `
                ${imagenHtml}
                ${iconoHtml}
                <h3>${cat.nombre}</h3>
                <p>${cat.descripcion || 'Sin descripción'}</p>
                <div class="card-buttons">
                    <button class="btn btn-primary" onclick="irASubcategorias(${cat.id}, '${cat.nombre}')">
                        Ver opciones
                    </button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        cardsContainer.innerHTML = '<p class="error">Error al cargar categorías</p>';
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
            abrirModal('authModal');
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
            <a href="admin-clientes.html">👥 Clientes</a>
            <a href="admin-proveedores.html">🏢 Proveedores</a>
            <a href="admin-cotizaciones.html">📊 Cotizaciones</a>
            <a href="admin-eventos.html">📅 Eventos</a>
        `;
    } else {
        menuContent += `
            <a href="mis-cotizaciones.html">💰 Mis Cotizaciones</a>
            <a href="mis-eventos.html">📅 Mis Eventos</a>
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
    alert(`👤 ${user.nombre}\n📧 ${user.email}\n📱 ${user.telefono || 'No especificado'}`);
    document.getElementById('userMenu').style.display = 'none';
}

function cerrarSesion() {
    auth.logout();
    window.location.reload();
}

// ===== FUNCIONES DE MODALES =====
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== FUNCIONES DE UI =====
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    menu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function initFadeIn() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                const menu = document.getElementById('navMenu');
                const hamburger = document.getElementById('hamburger');
                if (menu) menu.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
            }
        });
    });
}

// ===== FUNCIONES DEL CARRITO =====
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

// ===== FUNCIONES PARA TOAST =====
function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast');
    
    if (tipo === 'success') toast.classList.add('success');
    if (tipo === 'error') toast.classList.add('error');
    if (tipo === 'warning') toast.classList.add('warning');
    
    let icono = '';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
    
    toast.innerHTML = `<span class="toast-icon">${icono}</span>${mensaje}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 2800);
}

// ===== CORRECCIÓN PARA EL MODAL DE LOGIN =====
function corregirModalLogin() {
    const formLogin = document.getElementById('formLogin');
    if (!formLogin) return;
    
    const newForm = formLogin.cloneNode(true);
    formLogin.parentNode.replaceChild(newForm, formLogin);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            mostrarToast('Completa todos los campos', 'warning');
            return;
        }
        
        const result = await auth.login(email, password);
        
        if (result.success) {
            mostrarToast('Bienvenido', 'success');
            document.getElementById('authModal').style.display = 'none';
            actualizarBotonLogin();
        } else {
            mostrarToast(result.error, 'error');
        }
    });
}

function corregirModalRegistro() {
    const formRegister = document.getElementById('formRegister');
    if (!formRegister) return;
    
    const newForm = formRegister.cloneNode(true);
    formRegister.parentNode.replaceChild(newForm, formRegister);
    
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('regName')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const telefono = document.getElementById('regTelefono')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regConfirmPassword')?.value;
        
        if (!name || !email || !telefono || !password || !confirmPassword) {
            mostrarToast('Completa todos los campos', 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            mostrarToast('Las contraseñas no coinciden', 'warning');
            return;
        }
        
        const phoneClean = telefono.replace(/\D/g, '');
        const result = await auth.register({
            nombre: name,
            email: email,
            telefono: phoneClean,
            password: password
        });
        
        if (result.success) {
            mostrarToast('Registro exitoso', 'success');
            document.getElementById('authModal').style.display = 'none';
            actualizarBotonLogin();
        } else {
            mostrarToast(result.error, 'error');
        }
    });
}

// ===== EVENT LISTENERS =====
window.addEventListener('userLogin', () => {
    actualizarBotonLogin();
    actualizarBadge();
});

window.addEventListener('userLogout', () => {
    actualizarBotonLogin();
    actualizarBadge();
});

window.addEventListener('focus', () => {
    actualizarBotonLogin();
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main.js iniciado');
    
    await actualizarCardsInicio();
    actualizarBadge();
    initFadeIn();
    initSmoothScroll();
    actualizarBotonLogin();
    
    corregirModalLogin();
    corregirModalRegistro();
});

// Exponer funciones globales
window.irASubcategorias = irASubcategorias;
window.toggleMenu = toggleMenu;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;