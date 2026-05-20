// frontend/js/global-handlers.js
// ===== CENTRALIZED EVENT HANDLERS =====
// Este archivo contiene todas las funciones de manejo de eventos que antes estaban inline
// Se ejecuta después de auth.js y main.js

document.addEventListener('DOMContentLoaded', function() {
    // ===== TOGGLE MENU =====
    // Maneja la apertura/cierre del menú hamburguesa en dispositivos móviles
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    // ===== FORM SUBMISSION =====
    // Maneja el envío del formulario de contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', enviarFormulario);
    }

    // ===== MODAL IMAGE FILE TRIGGERS =====
    // Botones para seleccionar imágenes (categorías, subcategorías)
    delegateFileClick('categoriaImagenFile');
    delegateFileClick('editCategoriaImagenFile');
    delegateFileClick('subcategoriaImagenFile');
    delegateFileClick('editSubcategoriaImagenFile');

    // ===== CARRITO BUTTONS =====
    // Botones de vaciar carrito y solicitar cotización
    const btnVaciar = document.querySelector('button[data-action="vaciar-carrito"]');
    if (btnVaciar) {
        btnVaciar.addEventListener('click', vaciarCarrito);
    }

    const btnCotizar = document.querySelector('button[data-action="solicitar-cotizacion"]');
    if (btnCotizar) {
        btnCotizar.addEventListener('click', solicitarCotizacion);
    }

    // ===== PERFIL BUTTONS =====
    // Botones de editar perfil y cerrar sesión
    const btnEditar = document.querySelector('button[data-action="editar-perfil"]');
    if (btnEditar) {
        btnEditar.addEventListener('click', editarPerfil);
    }

    const btnLogout = document.querySelector('button[data-action="cerrar-sesion"]');
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }

    // ===== MODAL BUTTONS =====
    // Botones para cerrar modales
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.closeModal;
            cerrarModal(modalId);
        });
    });

    // ===== IR A PERFIL / SERVICIOS =====
    const btnPerfil = document.querySelector('[data-navigate="perfil"]');
    if (btnPerfil) {
        btnPerfil.addEventListener('click', irAPerfil);
    }

    const btnServicios = document.querySelector('[data-navigate="servicios"]');
    if (btnServicios) {
        btnServicios.addEventListener('click', abrirModalServicio);
    }

    // ===== EVENTOS =====
    const btnNuevoEvento = document.querySelector('[data-action="nuevo-evento"]');
    if (btnNuevoEvento) {
        btnNuevoEvento.addEventListener('click', abrirModalNuevoEvento);
    }

    // ===== MODAL CONFIRM BUTTONS =====
    // Botones en modales de confirmación
    document.querySelectorAll('[data-confirm-modal]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.confirmModal;
            cerrarModalConfirmar(modalId);
        });
    });
});

// ===== TOGGLE MENU =====
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// ===== MODAL FUNCTIONS =====
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'block';
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function cerrarModalSolicitud() {
    cerrarModal('modalSolicitud');
}

function cerrarModalConfirmar(modalId = 'modalConfirmar') {
    cerrarModal(modalId);
}

// ===== FILE INPUT DELEGATION =====
// Delega el click a un input file hidden
function delegateFileClick(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    document.querySelectorAll(`[data-file-input="${fileInputId}"]`).forEach(btn => {
        btn.addEventListener('click', function() {
            fileInput.click();
        });
    });
}

// ===== FORM HANDLER =====
async function enviarFormulario(event) {
    event.preventDefault();
    
    const form = event.target;
    const nombre = form.querySelector('input[name="nombre"]')?.value;
    const email = form.querySelector('input[name="email"]')?.value;
    const telefono = form.querySelector('input[name="telefono"]')?.value;
    const tipoEvento = form.querySelector('select[name="tipoEvento"]')?.value;
    const mensaje = form.querySelector('textarea[name="mensaje"]')?.value;

    if (!nombre || !email || !telefono || !tipoEvento || !mensaje) {
        alert('Por favor completa todos los campos');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/contactos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, telefono, tipoEvento, mensaje })
        });

        if (response.ok) {
            alert('¡Mensaje enviado! Te contactaremos pronto.');
            form.reset();
        } else {
            alert('Error al enviar el mensaje. Intenta más tarde.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar el mensaje');
    }
}

// ===== CARRITO HANDLERS =====
function vaciarCarrito() {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        localStorage.removeItem('fiestalandia_carrito');
        window.location.reload();
    }
}

async function solicitarCotizacion() {
    const carrito = JSON.parse(localStorage.getItem('fiestalandia_carrito')) || [];
    
    if (carrito.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    try {
        // Lógica para solicitar cotización
        const response = await fetch(`${API_URL}/cotizaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ servicios: carrito })
        });

        if (response.ok) {
            alert('Cotización solicitada exitosamente');
            // Redirigir a mis-cotizaciones
            window.location.href = 'mis-cotizaciones.html';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al solicitar cotización');
    }
}

// ===== PERFIL HANDLERS =====
function editarPerfil() {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (!usuario) {
        alert('Debes iniciar sesión primero');
        return;
    }
    
    const nuevoNombre = prompt('Nuevo nombre:', usuario.nombre || '');
    if (nuevoNombre && nuevoNombre.trim()) {
        usuario.nombre = nuevoNombre.trim();
        localStorage.setItem('user', JSON.stringify(usuario));
        
        if (typeof cargarPerfil === 'function') {
            cargarPerfil();
        } else {
            location.reload();
        }
    }
}

function cerrarSesion() {
    if (confirm('¿Deseas cerrar sesión?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('fiestalandia_carrito');
        window.location.href = 'index.html';
    }
}

// ===== NAVEGACIÓN HANDLERS =====
function irAPerfil() {
    const usuario = JSON.parse(localStorage.getItem('user'));
    if (usuario) {
        window.location.href = 'perfil.html';
    } else {
        alert('Debes iniciar sesión primero');
        // Abrir modal de login si existe
        if (document.getElementById('authModal')) {
            abrirModal('authModal');
        }
    }
}

function abrirModalServicio() {
    abrirModal('modalServicio');
}

function abrirModalNuevoEvento() {
    abrirModal('modalEvento');
}
