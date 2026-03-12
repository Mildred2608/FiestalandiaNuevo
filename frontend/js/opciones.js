/* ===== OPCIONES JS ===== */

function agregarOpciones(nombre, descripcion, precio) {
  agregarServicioCarrito(nombre, descripcion, precio);
}

/* Inicializar badge */

document.addEventListener('DOMContentLoaded', () => {
  actualizarBadge();
});