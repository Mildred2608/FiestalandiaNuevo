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
            <a href="admin-solicitudes.html">📋 Solicitudes de Registro</a>
        `;
    } else {
        menuContent += `
            <a href="mis-cotizaciones.html">💰 Mis Cotizaciones</a>
            <a href="mis-eventos.html">📅 Mis Eventos</a>
            <a href="solicitar-registro-servicio.html" class="menu-solicitar">📋 Registrar mi servicio</a>
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

// ===== SWITCH ENTRE FORMULARIOS LOGIN / REGISTRO =====
function initAuthModalSwitch() {
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin    = document.getElementById('switchToLogin');
    const formLogin        = document.getElementById('formLogin');
    const formRegister     = document.getElementById('formRegister');
    const modalTitle       = document.querySelector('#authModal h2');
    const modalSubtitle    = document.querySelector('#authModal .modal-header p');

    if (!switchToRegister || !switchToLogin || !formLogin || !formRegister) return;

    function mostrarRegistro() {
        formLogin.classList.remove('active');
        formRegister.classList.add('active');
        if (modalTitle) modalTitle.textContent = '¡Crea tu cuenta!';
        if (modalSubtitle) modalSubtitle.textContent = 'Regístrate para continuar';
    }

    function mostrarLogin() {
        formRegister.classList.remove('active');
        formLogin.classList.add('active');
        if (modalTitle) modalTitle.textContent = '¡Bienvenido!';
        if (modalSubtitle) modalSubtitle.textContent = 'Inicia sesión para continuar';
    }

    switchToRegister.addEventListener('click', (e) => { e.preventDefault(); mostrarRegistro(); });
    switchToLogin.addEventListener('click',    (e) => { e.preventDefault(); mostrarLogin(); });
}

// ===== HELPER: MOSTRAR ERROR INLINE =====
function mostrarErrorCampo(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('visible'); }
}

function limpiarErroresCampo(...ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = ''; el.classList.remove('visible'); }
    });
}

// ===== CORRECCIÓN PARA EL MODAL DE LOGIN =====
function corregirModalLogin() {
    const formLogin = document.getElementById('formLogin');
    if (!formLogin) return;

    const newForm = formLogin.cloneNode(true);
    formLogin.parentNode.replaceChild(newForm, formLogin);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErroresCampo('loginEmailError', 'loginPasswordError');

        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        let valid = true;

        if (!email) { mostrarErrorCampo('loginEmailError', 'El correo es obligatorio'); valid = false; }
        else if (!auth.isValidEmail(email)) { mostrarErrorCampo('loginEmailError', 'Email no válido'); valid = false; }
        if (!password) { mostrarErrorCampo('loginPasswordError', 'La contraseña es obligatoria'); valid = false; }
        if (!valid) return;

        const btn = newForm.querySelector('button[type="submit"]');
        const txtOriginal = btn.textContent;
        btn.disabled = true; btn.textContent = 'Iniciando sesión...';

        const result = await auth.login(email, password);

        btn.disabled = false; btn.textContent = txtOriginal;

        if (result.success) {
            mostrarToast('¡Bienvenido! 🎉', 'success');
            document.getElementById('authModal').style.display = 'none';
            actualizarBotonLogin();
        } else {
            mostrarToast(result.error || 'Error al iniciar sesión', 'error');
        }
    });
}

function corregirModalRegistro() {
    const formRegister = document.getElementById('formRegister');
    if (!formRegister) return;

    // Inyectar checkbox de términos si no existe
    if (!document.getElementById('regTerminos')) {
        const terminosGroup = document.createElement('div');
        terminosGroup.className = 'form-group terminos-group';
        terminosGroup.innerHTML = `
            <label class="checkbox-label">
                <input type="checkbox" id="regTerminos">
                <span>Acepto los <a href="#" style="color:#7c3aed;font-weight:600">términos y condiciones</a></span>
            </label>
            <div class="error-message" id="regTerminosError"></div>
        `;
        const submitBtn = formRegister.querySelector('button[type="submit"]');
        formRegister.insertBefore(terminosGroup, submitBtn);
    }

    const newForm = formRegister.cloneNode(true);
    formRegister.parentNode.replaceChild(newForm, formRegister);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErroresCampo('regNameError','regEmailError','regTelefonoError','regPasswordError','regConfirmError','regTerminosError');

        const name            = document.getElementById('regName')?.value.trim();
        const email           = document.getElementById('regEmail')?.value.trim();
        const telefono        = document.getElementById('regTelefono')?.value.trim();
        const password        = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regConfirmPassword')?.value;
        const terminos        = document.getElementById('regTerminos')?.checked;

        let valid = true;
        if (!name)  { mostrarErrorCampo('regNameError', 'El nombre es obligatorio'); valid = false; }
        if (!email) { mostrarErrorCampo('regEmailError', 'El correo es obligatorio'); valid = false; }
        else if (!auth.isValidEmail(email)) { mostrarErrorCampo('regEmailError', 'Email no válido'); valid = false; }
        if (!telefono) { mostrarErrorCampo('regTelefonoError', 'El teléfono es obligatorio'); valid = false; }
        else if (!auth.isValidPhone(telefono)) { mostrarErrorCampo('regTelefonoError', 'Debe tener 10 dígitos'); valid = false; }
        if (!password) { mostrarErrorCampo('regPasswordError', 'La contraseña es obligatoria'); valid = false; }
        else if (password.length < 8) { mostrarErrorCampo('regPasswordError', 'Mínimo 8 caracteres'); valid = false; }
        if (!confirmPassword) { mostrarErrorCampo('regConfirmError', 'Confirma tu contraseña'); valid = false; }
        else if (password !== confirmPassword) { mostrarErrorCampo('regConfirmError', 'Las contraseñas no coinciden'); valid = false; }
        if (!terminos) { mostrarErrorCampo('regTerminosError', 'Debes aceptar los términos'); valid = false; }
        if (!valid) return;

        const btn = newForm.querySelector('button[type="submit"]');
        const txtOriginal = btn.textContent;
        btn.disabled = true; btn.textContent = 'Registrando...';

        const result = await auth.register({
            nombre: name,
            email,
            telefono: telefono.replace(/\D/g, ''),
            password,
            rol: 'usuario'
        });

        btn.disabled = false; btn.textContent = txtOriginal;

        if (result.success) {
            mostrarToast('¡Cuenta creada exitosamente! 🎉', 'success');
            document.getElementById('authModal').style.display = 'none';
            actualizarBotonLogin();
        } else {
            mostrarToast(result.error || 'Error al registrar', 'error');
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

    // Inicializar modales de auth
    corregirModalLogin();
    corregirModalRegistro();
    initAuthModalSwitch();

    // Cerrar modal auth al hacer clic fuera
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Cerrar con botón X
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', () => {
            if (authModal) authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
});

// Exponer funciones globales
window.irASubcategorias = irASubcategorias;
window.toggleMenu = toggleMenu;
window.verPerfil = verPerfil;
window.cerrarSesion = cerrarSesion;