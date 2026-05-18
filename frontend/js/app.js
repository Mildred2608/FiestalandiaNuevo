function mostrarApartado(servicio){

const detalle=datosServicios[servicio];
const tituloDetalle=document.getElementById("titulo-detalle");
const contenidoDetalle=document.getElementById("contenido-detalle");
const seccionDetalle=document.getElementById("detalle");

tituloDetalle.textContent=detalle.titulo;
contenidoDetalle.innerHTML="";

detalle.items.forEach(item=>{

const div=document.createElement("div");
div.classList.add("subcard");

div.innerHTML=`
<h4>${item.nombre}</h4>
<p>${item.descripcion}</p>
`;

contenidoDetalle.appendChild(div);

});

seccionDetalle.classList.add("active");

seccionDetalle.scrollIntoView({behavior:"smooth"});

}


// Obtener categorías para las cards del inicio
app.get('/api/categorias', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        const [rows] = await pool.query(`
            SELECT id, nombre, descripcion, imagen_url 
            FROM categorias 
            ORDER BY nombre
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener categorías' 
        });
    }
});