// frontend/js/main.js

// ===== DATOS DE SERVICIOS =====
const datosServicios = {
    musica: {
        titulo: "Opciones de Música",
        items: [
            { nombre: "Grupos musicales", descripcion: "Bandas en vivo para tu evento.", precio: 8000 },
            { nombre: "DJ profesional", descripcion: "Mezclas en vivo y pista iluminada.", precio: 5000 },
            { nombre: "Mariachi", descripcion: "Música tradicional mexicana.", precio: 4000 },
            { nombre: "Sonido e iluminación", descripcion: "Equipo profesional completo.", precio: 3500 }
        ]
    },
    banquetes: {
        titulo: "Opciones de Banquetes",
        items: [
            { nombre: "Comida formal", descripcion: "Menús completos de alta cocina.", precio: 15000 },
            { nombre: "Taquizas", descripcion: "Comida tradicional mexicana.", precio: 6000 },
            { nombre: "Mesa de postres", descripcion: "Variedad de dulces y pasteles.", precio: 4000 },
            { nombre: "Bebidas y coctelería", descripcion: "Refrescos, cocteles y barra libre.", precio: 7000 }
        ]
    }
};

// ===== CARRITO =====
function obtenerCarrito() {
    try {
        return JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
    } catch (e) {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem('fiestalandia_carrito', JSON.stringify(carrito));
}

function agregarServicioCarrito(nombre, descripcion, precio) {
    const carrito = obtenerCarrito();
    const existente = carrito.find(item => item.nombre === nombre);
    
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion,
            precio: precio,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    actualizarBadge();
    mostrarToast(`"${nombre}" agregado al carrito`, 'success');
}

function actualizarBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const carrito = obtenerCarrito();
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
}

// ===== TOAST =====
function mostrarToast(mensaje, tipo = 'info') {
    const existente = document.querySelector('.toast');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.classList.add('toast');
    
    if (tipo === 'success') toast.classList.add('success');
    if (tipo === 'error') toast.classList.add('error');
    if (tipo === 'warning') toast.classList.add('warning');
    
    let icono = '📌';
    if (tipo === 'success') icono = '✅';
    if (tipo === 'error') icono = '❌';
    if (tipo === 'warning') icono = '⚠️';
    
    toast.innerHTML = `<span class="toast-icon">${icono}</span>${mensaje}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 2800);
}

// ===== FUNCIONES DE SERVICIOS =====
function mostrarApartado(servicio) {
    if (servicio === 'decoracion') {
        window.location.href = 'decoracion.html';
        return;
    }
    if (servicio === 'opciones') {
        window.location.href = 'opciones.html';
        return;
    }

    const detalle = datosServicios[servicio];
    if (!detalle) return;

    const tituloDetalle = document.getElementById("titulo-detalle");
    const contenidoDetalle = document.getElementById("contenido-detalle");
    const seccionDetalle = document.getElementById("detalle");

    tituloDetalle.textContent = detalle.titulo;
    contenidoDetalle.innerHTML = "";

    detalle.items.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("subcard");
        div.innerHTML = `
            <h4>${item.nombre}</h4>
            <p>${item.descripcion}</p>
            <p class="subcard-price">Desde $${item.precio.toLocaleString('es-MX')}</p>
            <button class="btn" onclick="agregarServicioCarrito('${item.nombre}', '${item.descripcion}', ${item.precio})">🛒 Agregar al carrito</button>
        `;
        contenidoDetalle.appendChild(div);
    });

    seccionDetalle.classList.add("active");
    seccionDetalle.scrollIntoView({ behavior: "smooth" });
}

// ===== FUNCIONES DE UI =====
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    const hamburger = document.getElementById('hamburger');
    menu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function enviarFormulario(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const tipoEvento = document.getElementById('tipoEvento').value;
    const fechaEvento = document.getElementById('fechaEvento').value;

    if (!nombre || !email || !telefono || !tipoEvento || !fechaEvento) {
        mostrarToast('⚠️ Por favor completa todos los campos requeridos', 'warning');
        return;
    }

    mostrarToast('✅ ¡Solicitud enviada! Te contactaremos pronto.', 'success');
    document.getElementById('contactForm').reset();
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

// ===== FUNCIONES DE SESIÓN Y PERFIL =====
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
    
    const userMenu = document.createElement('div');
    userMenu.id = 'userMenu';
    userMenu.className = 'user-menu';
    
    userMenu.innerHTML = `
        <div class="user-menu-header">
            <strong>${user.nombre}</strong>
            <small>${user.email}</small>
        </div>
        <div class="user-menu-items">
            <a href="#" onclick="verPerfil()">👤 Mi Perfil</a>
            <a href="#" onclick="verMisEventos()">📅 Mis Eventos</a>
            <a href="#" onclick="verCotizaciones()">💰 Mis Cotizaciones</a>
            <hr>
            <a href="#" onclick="cerrarSesion()" style="color: #dc3545;">🚪 Cerrar Sesión</a>
        </div>
    `;
    
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
    const perfilInfo = document.getElementById('perfilInfo');
    
    perfilInfo.innerHTML = `
        <div class="perfil-item">
            <div class="perfil-item-label"></i> Nombre completo</div>
            <div class="perfil-item-value">${user.nombre}</div>
        </div>
        <div class="perfil-item">
            <div class="perfil-item-label"></i> Correo electrónico</div>
            <div class="perfil-item-value">${user.email}</div>
        </div>
        <div class="perfil-item">
            <div class="perfil-item-label"></i> Teléfono</div>
            <div class="perfil-item-value">${user.telefono || 'No especificado'}</div>
        </div>
        <div class="perfil-item">
            <div class="perfil-item-label"></i> Rol</div>
            <div class="perfil-item-value" style="text-transform: capitalize;">${user.rol || 'cliente'}</div>
        </div>
    `;
    
    document.getElementById('userMenu').style.display = 'none';
    abrirModal('perfilModal');
}

function verMisEventos() {
    mostrarToast('Función de eventos en desarrollo', 'info');
    document.getElementById('userMenu').style.display = 'none';
}

function verCotizaciones() {
    mostrarToast('Función de cotizaciones en desarrollo', 'info');
    document.getElementById('userMenu').style.display = 'none';
}

function cerrarSesion() {
    auth.logout();
    actualizarBotonLogin();
    document.getElementById('userMenu').style.display = 'none';
    mostrarToast('Sesión cerrada exitosamente', 'success');
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

// ===== INICIALIZACIÓN DE MODALES =====
function initModales() {
    const modal = document.getElementById('authModal');
    const closeBtn = document.getElementById('closeAuthModal');
    const closePerfil = document.getElementById('closePerfilModal');
    const btnCerrarPerfil = document.getElementById('btnCerrarPerfil');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    
    // Cerrar modales
    closeBtn.onclick = () => cerrarModal('authModal');
    if (closePerfil) closePerfil.onclick = () => cerrarModal('perfilModal');
    if (btnCerrarPerfil) btnCerrarPerfil.onclick = () => cerrarModal('perfilModal');
    
    // Cerrar al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Switches entre login y registro
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.remove('active');
        formRegister.classList.add('active');
    });
    
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        formRegister.classList.remove('active');
        formLogin.classList.add('active');
    });
    
    // Formato de teléfono
    const regTelefono = document.getElementById('regTelefono');
    if (regTelefono) {
        regTelefono.addEventListener('input', (e) => {
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
    
    // Medidor de contraseña
    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
        regPassword.addEventListener('input', (e) => {
            const password = e.target.value;
            const segments = document.querySelectorAll('.strength-segment');
            let strength = 0;
            
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            segments.forEach((seg, index) => {
                if (index < strength) {
                    seg.classList.add('active');
                } else {
                    seg.classList.remove('active');
                }
            });
        });
    }
    
    // Login form
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            mostrarToast('Completa todos los campos', 'warning');
            return;
        }
        
        if (!auth.isValidEmail(email)) {
            mostrarToast('Correo electrónico inválido', 'warning');
            return;
        }
        
        const result = await auth.login(email, password);
        
        if (result.success) {
            mostrarToast(' ¡Bienvenido!', 'success');
            cerrarModal('authModal');
            actualizarBotonLogin();
        } else {
            mostrarToast(result.error, 'error');
        }
    });
    
    // Register form
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const telefono = document.getElementById('regTelefono').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (!name || !email || !telefono || !password || !confirmPassword) {
            mostrarToast('Completa todos los campos', 'warning');
            return;
        }
        
        if (!auth.isValidEmail(email)) {
            mostrarToast('Correo electrónico inválido', 'warning');
            return;
        }
        
        const phoneClean = telefono.replace(/\D/g, '');
        if (phoneClean.length !== 10) {
            mostrarToast('El teléfono debe tener 10 dígitos', 'warning');
            return;
        }
        
        if (password.length < 8) {
            mostrarToast('La contraseña debe tener al menos 8 caracteres', 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            mostrarToast('Las contraseñas no coinciden', 'warning');
            return;
        }
        
        const result = await auth.register({
            nombre: name,
            email: email,
            telefono: phoneClean,
            password: password
        });
        
        if (result.success) {
            mostrarToast(' ¡Registro exitoso!', 'success');
            cerrarModal('authModal');
            actualizarBotonLogin();
        } else {
            mostrarToast(result.error, 'error');
        }
    });
}

// ===== EVENT LISTENERS =====
window.addEventListener('userLogin', (e) => {
    actualizarBotonLogin();
});

window.addEventListener('userLogout', () => {
    actualizarBotonLogin();
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Main.js iniciado');
    actualizarBadge();
    initFadeIn();
    initSmoothScroll();
    actualizarBotonLogin();
    initModales();
});

// Exponer funciones globales
window.mostrarApartado = mostrarApartado;
window.agregarServicioCarrito = agregarServicioCarrito;
window.toggleMenu = toggleMenu;
window.enviarFormulario = enviarFormulario;
window.verPerfil = verPerfil;
window.verMisEventos = verMisEventos;
window.verCotizaciones = verCotizaciones;
window.cerrarSesion = cerrarSesion;