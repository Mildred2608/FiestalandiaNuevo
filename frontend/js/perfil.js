// Cargar perfil al iniciar
document.addEventListener("DOMContentLoaded", () => {
    cargarPerfil();
});

function cargarPerfil() {
    const usuario = JSON.parse(localStorage.getItem("user"));

    if (!usuario) {
        alert("No hay sesión activa");
        window.location.href = "index.html";
        return;
    }

    document.getElementById("nombre").textContent = usuario.nombre;
    document.getElementById("email").textContent = usuario.email;
    document.getElementById("telefono").textContent = "Tel: " + (usuario.telefono || "No especificado");
    document.getElementById("rol").textContent = usuario.rol || "Cliente";
}
// Editar perfil (simple)
function editarPerfil() {
    const nuevoNombre = prompt("Nuevo nombre:");
    if (nuevoNombre) {
        let usuario = JSON.parse(localStorage.getItem("usuario"));
        usuario.nombre = nuevoNombre;

        localStorage.setItem("usuario", JSON.stringify(usuario));
        cargarPerfil();
    }
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem("usuario");
    alert("Sesión cerrada");
    window.location.href = "index.html";
}