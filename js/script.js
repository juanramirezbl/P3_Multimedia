/* ============================================
   RONDA TURÍSTICA - JAVASCRIPT
   Funcionalidades accesibles
   ============================================ */

(function() {
  'use strict';

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
  const camposObligatorios = formulario.querySelectorAll('[required]');

  /**
   * @param {HTMLElement} campo
   * @returns {boolean}
   */
  function validarCampo(campo) {
    const idError = campo.getAttribute('aria-describedby');
    const errorEl = idError ? document.getElementById(idError.split(' ').find(id => id.startsWith('error-'))) : null;
    let valido = true;
    let mensaje = '';

    // Vacío
    if (campo.hasAttribute('required') && !campo.value.trim()) {
      valido = false;
      mensaje = 'Este campo es obligatorio.';
    }
    // Email
    else if (campo.type === 'email' && campo.value) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(campo.value)) {
        valido = false;
        mensaje = 'Introduce una dirección de correo electrónico válida (por ejemplo: nombre@dominio.com).';
      }
    }
    // Longitud mínima
    else if (campo.minLength && campo.value.length < campo.minLength) {
      valido = false;
      mensaje = `Este campo debe tener al menos ${campo.minLength} caracteres.`;
    }

    // Aplicar resultado
    if (errorEl) {
      errorEl.textContent = mensaje;
    }
    campo.setAttribute('aria-invalid', valido ? 'false' : 'true');

    return valido;
  }


  function validarPostal() {
    const radios = formulario.querySelectorAll('input[name="postal"]');
    const errorEl = document.getElementById('error-postal');
    const fieldset = document.getElementById('seleccion-postal');
    let alguno = false;
    radios.forEach(r => { if (r.checked) alguno = true; });

    if (!alguno) {
      if (errorEl) errorEl.textContent = 'Debes seleccionar una postal antes de enviar.';
      fieldset.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      if (errorEl) errorEl.textContent = '';
      fieldset.setAttribute('aria-invalid', 'false');
      return true;
    }
  }

  camposObligatorios.forEach(campo => {
    campo.addEventListener('blur', function() {
      if (campo.type === 'radio') return;
      validarCampo(campo);
    });
  });

  formulario.addEventListener('submit', function(e) {
    e.preventDefault();

    let todoValido = true;
    const errores = [];

    camposObligatorios.forEach(campo => {
      if (campo.type === 'radio') return;
      if (!validarCampo(campo)) {
        todoValido = false;
        const label = formulario.querySelector(`label[for="${campo.id}"]`);
        const nombreCampo = label ? label.textContent.replace('*', '').trim() : campo.name;
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
        <ul>${errores.map(e => `<li>${e}</li>`).join('')}</ul>
      `;
      mensajeGlobal.setAttribute('role', 'alert');
      mensajeGlobal.removeAttribute('hidden');

      const primerError = formulario.querySelector('[aria-invalid="true"]');
      if (primerError) {
        primerError.focus();
        primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const datos = new FormData(formulario);
    const remitente = datos.get('remitente');
    const destinatarioNombre = datos.get('destinatario-nombre');
    const destinatarioEmail = datos.get('destinatario-email');
    const postalSeleccionada = datos.get('postal');

    mensajeGlobal.innerHTML = `
      <strong>¡Postal enviada con éxito!</strong>
      <p>Hemos preparado tu postal de Ronda con los siguientes datos:</p>
      <ul>
        <li><strong>De:</strong> ${escaparHTML(remitente)}</li>
        <li><strong>Para:</strong> ${escaparHTML(destinatarioNombre)} (${escaparHTML(destinatarioEmail)})</li>
        <li><strong>Postal seleccionada:</strong> ${escaparHTML(postalSeleccionada)}</li>
      </ul>
      <p>Esta es una simulación con fines académicos. No se ha enviado ningún correo real.</p>
    `;
    mensajeGlobal.setAttribute('role', 'status');
    mensajeGlobal.removeAttribute('hidden');

    formulario.reset();
    document.querySelectorAll('[aria-invalid]').forEach(el => el.setAttribute('aria-invalid', 'false'));
    document.querySelectorAll('.mensaje-error').forEach(el => el.textContent = '');

    mensajeGlobal.setAttribute('tabindex', '-1');
    mensajeGlobal.focus();
    mensajeGlobal.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }
})();
