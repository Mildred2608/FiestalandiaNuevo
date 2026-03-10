/* ===== DECORACIÓN JS ===== */

function agregarDecoracion(nombre, descripcion, precio) {
  agregarServicioCarrito(nombre, descripcion, precio);
}

// Inicializar badge al cargar
document.addEventListener('DOMContentLoaded', () => {
  actualizarBadge();
});
