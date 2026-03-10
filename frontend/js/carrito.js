/* ===== CARRITO JS ===== */

function renderizarCarrito() {
  const carrito = obtenerCarrito();
  const carritoVacio = document.getElementById('carritoVacio');
  const carritoContenido = document.getElementById('carritoContenido');
  const carritoItems = document.getElementById('carritoItems');
  const resumenLines = document.getElementById('resumenLines');
  const totalPrecio = document.getElementById('totalPrecio');

  if (carrito.length === 0) {
    carritoVacio.style.display = 'block';
    carritoContenido.style.display = 'none';
    return;
  }

  carritoVacio.style.display = 'none';
  carritoContenido.style.display = 'grid';

  // Render items
  carritoItems.innerHTML = '';
  let total = 0;

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const div = document.createElement('div');
    div.classList.add('carrito-item');
    div.innerHTML = `
      <div class="item-icon">🎉</div>
      <div class="item-info">
        <h4>${item.nombre}</h4>
        <p>${item.descripcion}</p>
        <p class="item-price">$${item.precio.toLocaleString('es-MX')} c/u — Subtotal: $${subtotal.toLocaleString('es-MX')}</p>
      </div>
      <div class="item-controls">
        <button class="qty-btn" onclick="cambiarCantidad(${index}, -1)">−</button>
        <span class="qty-value">${item.cantidad}</span>
        <button class="qty-btn" onclick="cambiarCantidad(${index}, 1)">+</button>
      </div>
      <button class="btn-remove" onclick="eliminarItem(${index})" title="Eliminar">🗑️</button>
    `;
    carritoItems.appendChild(div);
  });

  // Render summary lines
  resumenLines.innerHTML = '';
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    resumenLines.innerHTML += `
      <div class="resumen-line">
        <span class="line-name">${item.nombre}</span>
        <span class="line-qty">×${item.cantidad}</span>
        <span class="line-price">$${subtotal.toLocaleString('es-MX')}</span>
      </div>
    `;
  });

  totalPrecio.textContent = `$${total.toLocaleString('es-MX')}`;
}

function cambiarCantidad(index, delta) {
  const carrito = obtenerCarrito();
  if (!carrito[index]) return;

  carrito[index].cantidad += delta;

  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }

  guardarCarrito(carrito);
  actualizarBadge();
  renderizarCarrito();
}

function eliminarItem(index) {
  const carrito = obtenerCarrito();
  if (!carrito[index]) return;

  const nombre = carrito[index].nombre;
  carrito.splice(index, 1);
  guardarCarrito(carrito);
  actualizarBadge();
  renderizarCarrito();
  mostrarToast(`"${nombre}" eliminado del carrito`);
}

function vaciarCarrito() {
  if (!confirm('¿Estás seguro de que deseas vaciar tu carrito?')) return;
  guardarCarrito([]);
  actualizarBadge();
  renderizarCarrito();
  mostrarToast('🗑️ Carrito vaciado');
}

function solicitarCotizacion() {
  const carrito = obtenerCarrito();
  if (carrito.length === 0) {
    mostrarToast('⚠️ Tu carrito está vacío');
    return;
  }

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const items = carrito.map(i => `• ${i.nombre} (×${i.cantidad})`).join('\n');

  mostrarToast('✅ ¡Cotización enviada! Te contactaremos pronto.');

  // Could redirect to contact or build a message
  setTimeout(() => {
    window.location.href = 'index.html#contacto';
  }, 1500);
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  actualizarBadge();
  renderizarCarrito();
});
