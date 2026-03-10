/* ===== DATOS DE SERVICIOS ===== */
const datosServicios = {

  lugar: {
    titulo: "Opciones de Lugar",
    items: [
      { nombre: "Salones de fiesta", descripcion: "Espacios cerrados para bodas y eventos.", precio: 8000 },
      { nombre: "Jardines", descripcion: "Eventos al aire libre con naturaleza.", precio: 6000 },
      { nombre: "Terrazas", descripcion: "Espacios modernos para celebraciones.", precio: 10000 },
      { nombre: "Haciendas", descripcion: "Lugares amplios y elegantes.", precio: 15000 }
    ]
  },

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

/* ===== MOSTRAR DETALLE DE SERVICIO ===== */
function mostrarApartado(servicio) {
  // Decoración redirige a su propia página
  if (servicio === 'decoracion') {
    window.location.href = 'decoracion.html';
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

/* ===== CARRITO — localStorage ===== */
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
  mostrarToast(`"${nombre}" agregado al carrito`);
}

function actualizarBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const carrito = obtenerCarrito();
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'inline-block' : 'none';
}

/* ===== TOAST ===== */
function mostrarToast(mensaje) {
  // Remove existing toast
  const existente = document.querySelector('.toast');
  if (existente) existente.remove();

  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 2800);
}

/* ===== MENU HAMBURGUESA ===== */
function toggleMenu() {
  const menu = document.getElementById('navMenu');
  const hamburger = document.getElementById('hamburger');
  menu.classList.toggle('active');
  hamburger.classList.toggle('active');
}

/* ===== FORMULARIO DE CONTACTO ===== */
function enviarFormulario(e) {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const tipoEvento = document.getElementById('tipoEvento').value;
  const fechaEvento = document.getElementById('fechaEvento').value;

  if (!nombre || !email || !telefono || !tipoEvento || !fechaEvento) {
    mostrarToast('⚠️ Por favor completa todos los campos requeridos');
    return;
  }

  mostrarToast('✅ ¡Solicitud enviada! Te contactaremos pronto.');
  document.getElementById('contactForm').reset();
}

/* ===== FADE-IN ANIMATION ===== */
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

/* ===== SMOOTH SCROLL FOR NAV LINKS ===== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });

        // Close mobile menu
        const menu = document.getElementById('navMenu');
        const hamburger = document.getElementById('hamburger');
        if (menu) menu.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
      }
    });
  });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  actualizarBadge();
  initFadeIn();
  initSmoothScroll();
});
