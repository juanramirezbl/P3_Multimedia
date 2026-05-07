

(function() {
  'use strict';

  const EMAILJS_CONFIG = {
    publicKey:  'qzfGkLet2FptsDZM4',
    serviceId:  'service_nf9ihre',
    templateId: 'template_odgbxk7'
  };

  const botonMenu = document.querySelector('.boton-menu');
  const navPrincipal = document.querySelector('.nav-principal');

  if (botonMenu && navPrincipal) {
    botonMenu.addEventListener('click', function() {
      const expandido = botonMenu.getAttribute('aria-expanded') === 'true';
      botonMenu.setAttribute('aria-expanded', !expandido);
      navPrincipal.classList.toggle('abierto');
      botonMenu.textContent = expandido ? '☰ Menú' : '✕ Cerrar';
    });
  }


  const formulario = document.getElementById('formulario-postal');
  if (!formulario) return;

  const mensajeGlobal = document.getElementById('mensaje-global');
  const botonEnviar  = document.getElementById('boton-enviar');
  const camposObligatorios = formulario.querySelectorAll('[required]');

  /**
   * Valida un campo (text/email/textarea/checkbox) y muestra el error.
   * @returns {boolean} true si es válido
   */
  function validarCampo(campo) {
    const idError = campo.getAttribute('aria-describedby');
    const errorEl = idError
        ? document.getElementById(idError.split(' ').find(id => id.startsWith('error-')))
        : null;
    let valido = true;
    let mensaje = '';

    if (campo.type === 'checkbox') {
      if (campo.hasAttribute('required') && !campo.checked) {
        valido = false;
        mensaje = 'Debes aceptar la política de privacidad para enviar la postal.';
      }
    }
    else if (campo.hasAttribute('required') && !campo.value.trim()) {
      valido = false;
      mensaje = 'Este campo es obligatorio.';
    }
    else if (campo.type === 'email' && campo.value) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(campo.value)) {
        valido = false;
        mensaje = 'Introduce una dirección de correo electrónico válida (por ejemplo: nombre@dominio.com).';
      }
    }
    else if (campo.minLength > 0 && campo.value.length < campo.minLength) {
      valido = false;
      mensaje = `Este campo debe tener al menos ${campo.minLength} caracteres.`;
    }

    if (errorEl) errorEl.textContent = mensaje;
    campo.setAttribute('aria-invalid', valido ? 'false' : 'true');
    return valido;
  }

  /**
   * Valida la selección del grupo de radios de postales.
   */
  function validarPostal() {
    const radios = formulario.querySelectorAll('input[name="postal"]');
    const errorEl = document.getElementById('error-postal');
    const fieldset = document.getElementById('seleccion-postal');
    const alguno = Array.from(radios).some(r => r.checked);

    if (!alguno) {
      if (errorEl) errorEl.textContent = 'Debes seleccionar una postal antes de enviar.';
      fieldset.setAttribute('aria-invalid', 'true');
      return false;
    }
    if (errorEl) errorEl.textContent = '';
    fieldset.setAttribute('aria-invalid', 'false');
    return true;
  }

  camposObligatorios.forEach(campo => {
    const evento = (campo.type === 'checkbox') ? 'change' : 'blur';
    campo.addEventListener(evento, function() {
      if (campo.type === 'radio') return;
      validarCampo(campo);
    });
  });


  formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    let todoValido = true;
    const errores = [];

    camposObligatorios.forEach(campo => {
      if (campo.type === 'radio') return;
      if (!validarCampo(campo)) {
        todoValido = false;
        const label = formulario.querySelector(`label[for="${campo.id}"]`);
        const nombreCampo = label
            ? label.textContent.replace('*', '').trim()
            : campo.name;
        errores.push(nombreCampo);
      }
    });

    if (!validarPostal()) {
      todoValido = false;
      errores.push('Selección de postal');
    }

    if (!todoValido) {
      mensajeGlobal.innerHTML = `
        <strong>Por favor, corrige los siguientes errores antes de enviar:</strong>
        <ul>${errores.map(err => `<li>${escaparHTML(err)}</li>`).join('')}</ul>
      `;
      mensajeGlobal.className = 'mensaje-global mensaje-error-global';
      mensajeGlobal.setAttribute('role', 'alert');
      mensajeGlobal.removeAttribute('hidden');
      const primerError = formulario.querySelector('[aria-invalid="true"]');
      if (primerError) {
        primerError.focus();
        primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (
        EMAILJS_CONFIG.publicKey === 'TU_PUBLIC_KEY_AQUI' ||
        EMAILJS_CONFIG.serviceId === 'TU_SERVICE_ID_AQUI' ||
        EMAILJS_CONFIG.templateId === 'TU_TEMPLATE_ID_AQUI'
    ) {
      mostrarMensajeError(
          'El envío de postales no está configurado. ' +
          'El administrador del sitio debe rellenar las credenciales de EmailJS en js/script.js. ' +
          'Mientras tanto, los datos del formulario son correctos pero no se ha enviado el correo.'
      );
      return;
    }

    if (typeof emailjs === 'undefined') {
      mostrarMensajeError(
          'No se ha podido cargar el servicio de envío. Comprueba tu conexión a Internet e inténtalo de nuevo.'
      );
      return;
    }

    const datos = new FormData(formulario);

    // --- CÓDIGO ACTUALIZADO: URLs ABSOLUTAS Y CORRECCIÓN DE TILDE ---
    const baseUrl = 'https://juanramirezbl.github.io/P3_Multimedia/img/postales/';

    const imagenesPostales = {
      'Puente Nuevo al atardecer': baseUrl + 'postal-1.jpeg',
      'Plaza de Toros':            baseUrl + 'postal-2.jpeg',
      'Vistas del Tajo':           baseUrl + 'postal-3.jpeg',
      'Casco antiguo':             baseUrl + 'postal-4.jpeg',
      'Serranía al amanecer':      baseUrl + 'postal-5.jpeg'
    };

    const postalSeleccionada = datos.get('postal');
    const urlImagen = imagenesPostales[postalSeleccionada] || '';
    // ----------------------------------------------------------------

    const parametros = {
      from_name:  datos.get('remitente'),
      from_email: datos.get('remitente-email'),
      to_name:    datos.get('destinatario-nombre'),
      to_email:   datos.get('destinatario-email'),
      postal:       postalSeleccionada,
      postal_imagen: urlImagen,
      mensaje:    datos.get('mensaje'),
      idioma:     datos.get('idioma') || 'es'
    };

    // 4.4 Estado de "enviando"
    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Enviando…';
    mensajeGlobal.innerHTML = '<p>Enviando tu postal, por favor espera…</p>';
    mensajeGlobal.className = 'mensaje-global';
    mensajeGlobal.setAttribute('role', 'status');
    mensajeGlobal.setAttribute('aria-live', 'polite');
    mensajeGlobal.removeAttribute('hidden');

    try {
      // Inicializar EmailJS si no está inicializado
      emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });

      const resultado = await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          parametros
      );

      if (resultado.status === 200) {
        mostrarMensajeExito(parametros);
        formulario.reset();
        document.querySelectorAll('[aria-invalid]').forEach(el => el.setAttribute('aria-invalid', 'false'));
        document.querySelectorAll('.mensaje-error').forEach(el => el.textContent = '');
      } else {
        mostrarMensajeError(
            `El servicio devolvió un código inesperado (${resultado.status}). Inténtalo de nuevo más tarde.`
        );
      }

    } catch (error) {
      let descripcion = 'No se ha podido enviar la postal. ';
      if (error && error.text) {
        descripcion += 'Detalle: ' + error.text;
      } else if (error && error.message) {
        descripcion += 'Detalle: ' + error.message;
      } else {
        descripcion += 'Comprueba tu conexión a Internet e inténtalo de nuevo.';
      }
      mostrarMensajeError(descripcion);

    } finally {
      botonEnviar.disabled = false;
      botonEnviar.textContent = 'Enviar postal';
    }
  });


  function mostrarMensajeExito(p) {
    mensajeGlobal.innerHTML = `
      <strong>¡Postal enviada con éxito!</strong>
      <p>Hemos enviado tu postal de Ronda con los siguientes datos:</p>
      <ul>
        <li><strong>De:</strong> ${escaparHTML(p.from_name)} (${escaparHTML(p.from_email)})</li>
        <li><strong>Para:</strong> ${escaparHTML(p.to_name)} (${escaparHTML(p.to_email)})</li>
        <li><strong>Postal seleccionada:</strong> ${escaparHTML(p.postal)}</li>
      </ul>
      <p>El destinatario recibirá la postal en su correo en unos instantes. Si no la encuentra, debe revisar la carpeta de Spam.</p>
    `;
    mensajeGlobal.className = 'mensaje-global mensaje-exito-global';
    mensajeGlobal.setAttribute('role', 'status');
    mensajeGlobal.setAttribute('aria-live', 'polite');
    mensajeGlobal.setAttribute('tabindex', '-1');
    mensajeGlobal.removeAttribute('hidden');
    mensajeGlobal.focus();
    mensajeGlobal.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function mostrarMensajeError(texto) {
    mensajeGlobal.innerHTML = `
      <strong>No ha sido posible enviar la postal</strong>
      <p>${escaparHTML(texto)}</p>
    `;
    mensajeGlobal.className = 'mensaje-global mensaje-error-global';
    mensajeGlobal.setAttribute('role', 'alert');
    mensajeGlobal.removeAttribute('aria-live');
    mensajeGlobal.setAttribute('tabindex', '-1');
    mensajeGlobal.removeAttribute('hidden');
    mensajeGlobal.focus();
    mensajeGlobal.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }


  function escaparHTML(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
  }
})();
