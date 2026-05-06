// ===== CHATBOT FIESTALANDIA =====
// Componente de chat flotante con respuestas predefinidas

(function () {
  'use strict';

  // --- Respuestas predefinidas ---
  const respuestas = [
    {
      palabras: ['servicio', 'servicios', 'ofrecen', 'ofreces', 'tienen', 'qué hacen', 'que hacen', 'qué ofrecen', 'que ofrecen','1'],
      respuesta: '🎉 En Fiestalandia ofrecemos tres categorías principales de servicios:\n\n🍽️ <b>Comida</b> — Platillos típicos y banquetes para tu evento.\n🎨 <b>Decoración</b> — Decoraciones infantiles y temáticas.\n📍 <b>Lugar</b> — Opciones increíbles de salones y espacios.\n\nPuedes explorarlos en la sección de <b>Servicios</b> de nuestra página.'
    },
    {
      palabras: ['carrito', 'agregar', 'agregar productos', 'añadir', 'cómo agrego', 'como agrego', 'comprar','2'],
      respuesta: '🛒 Para agregar servicios a tu carrito:\n\n1. Ve a la sección <b>Servicios</b>.\n2. Haz clic en <b>"Ver opciones"</b> en la categoría que te interese.\n3. Selecciona el servicio deseado y presiona <b>"Agregar al carrito"</b>.\n4. Puedes ver tu carrito haciendo clic en el botón <b>🛒 Carrito</b> en la barra de navegación.'
    },
    {
      palabras: ['administrador', 'admin', 'contactar administrador', 'contacto admin', 'hablar con administrador','3'],
      respuesta: '👨‍💼 Para comunicarte con un administrador tienes varias opciones:\n\n• Usa la sección de <b>Contacto</b> en nuestra página y envía tu mensaje.\n• Llámanos al <b>(123) 456-7890</b>.\n• Envía un correo a <b>contacto@fiestalandia.com</b>.\n\n¡Te responderemos en menos de 24 horas!'
    },
    {
      palabras: ['comida', 'decoración', 'decoracion', 'lugar', 'contratar', 'paquete', 'combo',],
      respuesta: '¡Claro que sí! Puedes contratar servicios de <b>Comida</b>, <b>Decoración</b> y <b>Lugar</b> de forma individual o combinada.\n\nSimplemente agrega al carrito los servicios que necesites y solicita una cotización. ¡Arma el evento perfecto a tu medida! 🎊'
    },
    {
      palabras: ['seleccionados', 'mis servicios', 'ver servicios', 'dónde veo', 'donde veo', 'mis productos', 'mi carrito'],
      respuesta: '📋 Para ver los servicios que has seleccionado, haz clic en el botón <b>🛒 Carrito</b> en la barra de navegación superior.\n\nAhí encontrarás un resumen con todos los servicios agregados, precios y la opción de solicitar una cotización formal.'
    },
    {
      palabras: ['precio', 'precios', 'costo', 'costos', 'cuánto cuesta', 'cuanto cuesta', 'cotización', 'cotizacion', 'cotizar','4'],
      respuesta: '💰 Los precios de cada servicio se muestran al hacer clic en <b>"Ver opciones"</b> dentro de cada categoría.\n\nPuedes agregar los que te interesen al carrito y solicitar una <b>cotización personalizada</b>. Un administrador te enviará el presupuesto detallado. 📩'
    },
    {
      palabras: ['hola', 'hey', 'buenas', 'buenos días', 'buenos dias', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'saludos'],
      respuesta: '¡Hola! Bienvenido al asistente de <b>Fiestalandia</b>.\n\nEstoy aquí para ayudarte con información sobre nuestros servicios, el carrito de compras, contacto y más. ¿En qué puedo ayudarte?'
    },
    {
      palabras: ['gracias', 'thank', 'muchas gracias', 'te agradezco', 'perfecto', 'genial', 'excelente'],
      respuesta: '¡Con mucho gusto! Si tienes alguna otra pregunta no dudes en escribirme.\n\n¡En Fiestalandia queremos que tu evento sea inolvidable! 🎉'
    },
    {
      palabras: ['evento', 'eventos', 'tipo de evento', 'tipos de eventos', 'qué eventos', 'que eventos', 'boda', 'xv', 'cumpleaños', 'cumpleanos', 'bautizo', 'graduación', 'graduacion','5'],
      respuesta: '🎊 Organizamos todo tipo de eventos:\n\n💒 <b>Bodas</b>\n👸 <b>XV Años</b>\n🎂 <b>Cumpleaños</b>\n⛪ <b>Bautizos</b>\n🎓 <b>Graduaciones</b>\n🏢 <b>Eventos Corporativos</b>\n\nCada evento se personaliza según tus necesidades. ¡Cuéntanos qué tienes en mente!'
    },
    {
      palabras: ['horario', 'horarios', 'hora', 'abren', 'cierran', 'atienden', 'abierto','6'],
      respuesta: '🕐 Nuestro horario de atención es:\n\n📅 <b>Lunes a Sábado</b>\n⏰ <b>9:00 AM — 7:00 PM</b>\n\n¡Te esperamos!'
    },
    {
      palabras: ['dirección', 'direccion', 'ubicación', 'ubicacion', 'dónde están', 'donde estan', 'dónde quedan', 'donde quedan'],
      respuesta: '📍 Nos encontramos en:\n\n<b>Av. Celebración #100, Col. Fiesta, CP 01234</b>\n\n¡Ven a visitarnos y conoce nuestros servicios en persona!'
    },
    {
      palabras: ['registro', 'registrarme', 'cuenta', 'crear cuenta', 'login', 'iniciar sesión', 'iniciar sesion','7'],
      respuesta: '🔐 Para crear tu cuenta o iniciar sesión:\n\n1. Haz clic en el botón <b>🔐 Login</b> en la barra de navegación.\n2. Si ya tienes cuenta, ingresa tu correo y contraseña.\n3. Si eres nuevo, haz clic en <b>"Regístrate aquí"</b> y completa tus datos.\n\n¡Es rápido y sencillo!'
    },
    {
      palabras: ['ayuda', 'help', 'información', 'informacion', 'info', 'opciones', 'qué puedo', 'que puedo', 'qué sabes', 'que sabes'],
      respuesta: 'Puedo ayudarte con lo siguiente:\n\n  <b>Ingresa la palabra clave o número</b>\n\n1.- 🎉 Información sobre nuestros <b>servicios</b>\n2.- 🛒 Cómo usar el <b>carrito</b>\n3.- 👨‍💼 Cómo contactar al <b>administrador</b>\n4.- 💰 Información de <b>precios y cotizaciones</b>\n5.- 🎊 <b>Tipos de eventos</b> que organizamos\n6.- 🕐 <b>Horarios</b> y <b>ubicación</b>\n7.- 🔐 Ayuda con <b>registro e inicio de sesión</b>\n\n¡Pregúntame lo que necesites!'
    }
  ];

  const respuestaDefault = 'Por el momento solo puedo ayudarte con información básica de Fiestalandia. Puedes comunicarte con un administrador para más detalles. \n\nEscribe <b>"ayuda"</b> para ver los temas con los que puedo asistirte.';

  // --- Buscar respuesta ---
  function buscarRespuesta(mensaje) {
    const msgLower = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const item of respuestas) {
      for (const palabra of item.palabras) {
        const palabraNorm = palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (msgLower.includes(palabraNorm)) {
          return item.respuesta;
        }
      }
    }
    return respuestaDefault;
  }

  // --- Crear HTML del chatbot ---
  function crearChatbot() {
    // Botón flotante
    const boton = document.createElement('button');
    boton.id = 'chatbot-toggle';
    boton.setAttribute('aria-label', 'Abrir chat de asistencia');
    boton.innerHTML = `
      <span class="chatbot-toggle-icon">💬</span>
      <span class="chatbot-toggle-text">Chat</span>
    `;

    // Ventana del chat
    const ventana = document.createElement('div');
    ventana.id = 'chatbot-window';
    ventana.classList.add('chatbot-hidden');
    ventana.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-info">
          <div class="chatbot-avatar">🎉</div>
          <div>
            <div class="chatbot-title">Asistente Fiestalandia</div>
            <div class="chatbot-status"><span class="chatbot-status-dot"></span> En línea</div>
          </div>
        </div>
        <button class="chatbot-close" id="chatbot-close" aria-label="Cerrar chat">&times;</button>
      </div>
      <div class="chatbot-messages" id="chatbot-messages">
        <!-- Los mensajes se agregan dinámicamente -->
      </div>
      <div class="chatbot-input-area">
        <input type="text" id="chatbot-input" placeholder="Escribe tu pregunta..." autocomplete="off" />
        <button id="chatbot-send" aria-label="Enviar mensaje">Enviar</button>
      </div>
    `;

    document.body.appendChild(boton);
    document.body.appendChild(ventana);

    // --- Eventos ---
    boton.addEventListener('click', toggleChat);
    document.getElementById('chatbot-close').addEventListener('click', cerrarChat);
    document.getElementById('chatbot-send').addEventListener('click', enviarMensaje);
    document.getElementById('chatbot-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        enviarMensaje();
      }
    });

    // Mensaje de bienvenida
    agregarMensajeBot('¡Hola!  Soy el asistente de <b>Fiestalandia</b>. ¿En qué puedo ayudarte hoy?\n\nEscribe <b>"ayuda"</b> para ver todos los temas disponibles.');
  }

  // --- Toggle chat ---
  function toggleChat() {
    const ventana = document.getElementById('chatbot-window');
    const boton = document.getElementById('chatbot-toggle');

    if (ventana.classList.contains('chatbot-hidden')) {
      ventana.classList.remove('chatbot-hidden');
      ventana.classList.add('chatbot-visible');
      boton.classList.add('chatbot-toggle-active');
      // Focus en el input
      setTimeout(() => document.getElementById('chatbot-input').focus(), 300);
    } else {
      cerrarChat();
    }
  }

  function cerrarChat() {
    const ventana = document.getElementById('chatbot-window');
    const boton = document.getElementById('chatbot-toggle');
    ventana.classList.remove('chatbot-visible');
    ventana.classList.add('chatbot-hidden');
    boton.classList.remove('chatbot-toggle-active');
  }

  // --- Enviar mensaje ---
  function enviarMensaje() {
    const input = document.getElementById('chatbot-input');
    const texto = input.value.trim();
    if (!texto) return;

    agregarMensajeUsuario(texto);
    input.value = '';

    // Simular escritura del bot
    mostrarTyping();

    setTimeout(() => {
      quitarTyping();
      const respuesta = buscarRespuesta(texto);
      agregarMensajeBot(respuesta);
    }, 800 + Math.random() * 600);
  }

  // --- Agregar mensajes al DOM ---
  function agregarMensajeUsuario(texto) {
    const container = document.getElementById('chatbot-messages');
    const hora = obtenerHora();

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chatbot-msg', 'chatbot-msg-user');
    msgDiv.innerHTML = `
      <div class="chatbot-msg-bubble">
        <p>${escapeHTML(texto)}</p>
        <span class="chatbot-msg-time">${hora}</span>
      </div>
    `;

    container.appendChild(msgDiv);
    scrollAlFinal(container);
  }

  function agregarMensajeBot(html) {
    const container = document.getElementById('chatbot-messages');
    const hora = obtenerHora();

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chatbot-msg', 'chatbot-msg-bot');
    msgDiv.innerHTML = `
      <div class="chatbot-msg-avatar">🎉</div>
      <div class="chatbot-msg-bubble">
        <p>${html.replace(/\n/g, '<br>')}</p>
        <span class="chatbot-msg-time">${hora}</span>
      </div>
    `;

    container.appendChild(msgDiv);
    scrollAlFinal(container);
  }

  function mostrarTyping() {
    const container = document.getElementById('chatbot-messages');
    const typing = document.createElement('div');
    typing.classList.add('chatbot-msg', 'chatbot-msg-bot', 'chatbot-typing');
    typing.id = 'chatbot-typing';
    typing.innerHTML = `
      <div class="chatbot-msg-avatar">🎉</div>
      <div class="chatbot-msg-bubble chatbot-typing-bubble">
        <span class="chatbot-dot"></span>
        <span class="chatbot-dot"></span>
        <span class="chatbot-dot"></span>
      </div>
    `;
    container.appendChild(typing);
    scrollAlFinal(container);
  }

  function quitarTyping() {
    const typing = document.getElementById('chatbot-typing');
    if (typing) typing.remove();
  }

  // --- Utilidades ---
  function obtenerHora() {
    const now = new Date();
    return now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function scrollAlFinal(container) {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }

  // --- Inicializar cuando el DOM esté listo ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearChatbot);
  } else {
    crearChatbot();
  }

})();
