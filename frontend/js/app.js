const datosServicios = {

lugar:{
titulo:"Opciones de Lugar",
items:[
{nombre:"Salones de fiesta",descripcion:"Espacios cerrados para bodas y eventos."},
{nombre:"Jardines",descripcion:"Eventos al aire libre."},
{nombre:"Terrazas",descripcion:"Espacios modernos para celebraciones."},
{nombre:"Haciendas",descripcion:"Lugares amplios y elegantes."}
]
},

musica:{
titulo:"Opciones de Música",
items:[
{nombre:"Grupos musicales",descripcion:"Bandas en vivo."},
{nombre:"DJ",descripcion:"Mezclas en vivo."},
{nombre:"Mariachi",descripcion:"Música tradicional mexicana."},
{nombre:"Sonido",descripcion:"Equipo profesional."}
]
},

banquetes:{
titulo:"Opciones de Banquetes",
items:[
{nombre:"Comida formal",descripcion:"Menús completos."},
{nombre:"Taquizas",descripcion:"Comida tradicional."},
{nombre:"Mesa de postres",descripcion:"Variedad de dulces."},
{nombre:"Bebidas",descripcion:"Refrescos y cocteles."}
]
},

decoracion:{
titulo:"Opciones de Decoración",
items:[
{nombre:"Decoración temática",descripcion:"Diseños personalizados."},
{nombre:"Arreglos florales",descripcion:"Centros de mesa."},
{nombre:"Globos",descripcion:"Decoración moderna."},
{nombre:"Iluminación",descripcion:"Luces decorativas."}
]
}

};

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