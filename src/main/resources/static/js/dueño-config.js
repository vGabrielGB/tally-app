// ==========================================
// 1. VARIABLES Y FUNCIONES GLOBALES
// ==========================================

let listaGlobalPeriodos = [];
let listaGlobalConceptos = [];
let listaGlobalCuentas = [];

// --- Función para Editar Concepto ---
window.editarConcepto = function(id) {
    console.log("Editando concepto ID:", id);
    const c = listaGlobalConceptos.find(x => x.id === id);
    if (!c) return;

    // Llenar Modal
    const modal = document.getElementById('modalConcepto');
    document.getElementById('conceptId').value = c.id;
    document.getElementById('conceptName').value = c.nombre;
    document.getElementById('conceptAmount').value = c.montoDefault;
    document.getElementById('conceptDate').value = c.fechaVencimiento;
    document.getElementById('conceptGrace').value = c.prorroga || 0;
    const selectMoneda = document.getElementById('conceptCurrency');
    if (c.divisaId === 2) {
        selectMoneda.value = 'EUR';
    } else {
        selectMoneda.value = 'USD';
    }
    
    // Cambiar título
    const titulo = document.getElementById('conceptModalTitle');
    if(titulo) titulo.textContent = "Editar Concepto";

    modal.classList.add('active');
};

// --- Función para Editar Cuenta (Desde el botón HTML) ---
window.editarCuenta = function(id) {
    console.log("Editando cuenta ID:", id);
    const c = listaGlobalCuentas.find(x => x.id === id);
    if (!c) return;

    const modal = document.getElementById('modalMetodo');
    const tipoSel = document.getElementById('methodTypeSelector');
    
    // 1. Llenar campos base
    document.getElementById('methodId').value = c.id;
    document.getElementById('methodInst').value = c.instrucciones || '';
    if(tipoSel) {
        tipoSel.value = c.tipo.toLowerCase();
        // Disparar evento de cambio manualmente para dibujar los inputs
        tipoSel.dispatchEvent(new Event('change'));
    }

    // 2. Llenar inputs dinámicos (Pequeño delay para que el DOM se dibuje)
    setTimeout(() => {
        const inputs = document.querySelectorAll('#dynamicMethodFields input');
        // Lógica de llenado según tipo
        if (c.tipo === 'PAGO_MOVIL' && inputs.length >= 3) {
            inputs[0].value = c.banco;
            inputs[1].value = c.telefono;
            inputs[2].value = c.identificador;
        } else if (c.tipo === 'TRANSFERENCIA' && inputs.length >= 4) {
            inputs[0].value = c.banco;
            inputs[1].value = c.numeroCuenta;
            inputs[2].value = c.titular;
            inputs[3].value = c.identificador;
        }
        // Agrega lógica para Zelle si la tienes
    }, 50);

    const titulo = document.getElementById('methodModalTitle');
    if(titulo) titulo.textContent = "Editar Método";

    modal.classList.add('active');
};

// --- Funciones de Borrado y Activación ---
window.borrarConcepto = async function(id, pid) {
    if (confirm("¿Eliminar concepto?")) {
        try {
            await fetch(`/api/config/concepto/${id}`, { method: 'DELETE' });
            // Necesitamos recargar. Disparamos un evento custom o recargamos todo.
            document.dispatchEvent(new CustomEvent('recargarConceptos', { detail: pid }));
        } catch (e) { mostrarNotificacion("Error al eliminar concepto", "error"); }
    }
};

window.borrarCuenta = async function(id) {
    if (confirm("¿Eliminar cuenta?")) {
        try {
            await fetch(`/api/config/cuenta/${id}`, { method: 'DELETE' });
            document.dispatchEvent(new Event('recargarCuentas'));
        } catch (e) { mostrarNotificacion("Error al eliminar cuenta", "error"); }
    }
};

window.toggleCuenta = async function(id) {
  // 1. Buscar la tarjeta en el DOM usando el ID del botón
      const checkbox = document.querySelector(`input[onchange="window.toggleCuenta(${id})"]`);
      const card = checkbox.closest('.payment-item');

      // 2. Cambio Visual Inmediato (Feedback al usuario)
      if (checkbox.checked) {
          card.classList.remove('inactive'); // Se "enciende"
      } else {
          card.classList.add('inactive'); // Se "apaga/sombrea"
      }

      // 3. Petición Silenciosa al Backend
      try {
          await fetch(`/api/config/cuenta/${id}/toggle`, { method: 'POST' });
          // No llamamos a cargarDatosPago() para evitar el parpadeo
          // Ya actualizamos visualmente, confiamos en que el backend lo guardó.
      } catch(e) { 
          console.error(e);
          // Si falla, revertimos el cambio visual
          checkbox.checked = !checkbox.checked;
          if(checkbox.checked) card.classList.remove('inactive');
          else card.classList.add('inactive');
          mostrarNotificacion("Error de conexión", "error");
      }
};

window.activarPeriodoUnico = async function(id, checkbox) {
    if (!checkbox.checked) { checkbox.checked = true; return; }
    if (confirm("¿Activar este periodo?")) {
        try {
            await fetch(`/api/config/periodo/${id}/activar`, { method: 'POST' });
            document.dispatchEvent(new Event('recargarPeriodos'));
        } catch (e) { checkbox.checked = false; }
    } else {
        checkbox.checked = false;
    }
};

window.eliminarPeriodo = async function(id) {
    if (confirm("¿Eliminar periodo?")) {
        try {
            const res = await fetch(`/api/config/periodo/${id}`, { method: 'DELETE' });
            if (res.ok) document.dispatchEvent(new Event('recargarPeriodos'));
            else mostrarNotificacion("Error al eliminar periodo", "error");
        } catch (e) { mostrarNotificacion("Error al eliminar periodo", "error"); }
    }
};


// ==========================================
// 2. DOM CONTENT LOADED (Lógica Principal)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("JS Cargado correctamente");

    // --- REFERENCIAS DOM ---
    const periodSelector = document.getElementById('periodSelector');
    const conceptsTable = document.getElementById('conceptsTableBody');
    const periodDisplayDates = document.getElementById('periodDisplayDates');
    const methodsList = document.getElementById('paymentMethodsList');
    const periodList = document.getElementById('periodList');
    const activePeriodTitle = document.getElementById('activePeriodTitle');
    const activePeriodDates = document.getElementById('activePeriodDates');
    const topBadge = document.querySelector('.period-status-badge');

    // --- INICIALIZAR ---
    cargarTodo();

    // Listeners para recargas globales (conectados a las funciones window)
    document.addEventListener('recargarPeriodos', () => cargarPeriodos());
    document.addEventListener('recargarCuentas', () => cargarDatosPago());
    document.addEventListener('recargarConceptos', (e) => cargarConceptos(e.detail));

    function cargarTodo() {
        cargarPeriodos();
        cargarDatosPago();
    }

    // ==========================================
    // 3. CARGAR PERIODOS
    // ==========================================
    async function cargarPeriodos() {
        if (!periodList) return;
        try {
            const res = await fetch('/api/config/periodos');
            listaGlobalPeriodos = await res.json();

            periodSelector.innerHTML = '';
            periodList.innerHTML = '';

            if (listaGlobalPeriodos.length === 0) {
                periodList.innerHTML = '<p class="empty-msg">Sin periodos.</p>';
                if(activePeriodTitle) activePeriodTitle.textContent = "Sin Periodo";
                return;
            }

            let activo = null;
            const seleccionActual = periodSelector.value;

            listaGlobalPeriodos.forEach(p => {
                const esActivo = p.estatus === 'ACTIVO';
                if (esActivo) activo = p;

                // Select Filtro
                const op = document.createElement('option');
                op.value = p.id;
                op.textContent = p.nombre;
                periodSelector.appendChild(op);

                // Lista Historial
                const checked = esActivo ? 'checked' : '';
                const disabled = esActivo ? 'disabled style="opacity:0.5"' : '';

                periodList.innerHTML += `
                  <div class="payment-item">
                    <div class="pay-info">
                      <strong>${p.nombre}</strong>
                      <span style="font-size:0.8rem; color:#888;">${p.fechaInicio} / ${p.fechaFin}</span>
                    </div>
                    <div class="pay-actions" style="display:flex; gap:10px; align-items:center;">
                      <label class="toggle-switch">
                        <input type="checkbox" ${checked} onchange="window.activarPeriodoUnico(${p.id}, this)">
                        <span class="slider"></span>
                      </label>
                      <button class="btn-sm warning" style="padding:4px 8px; cursor:pointer;" onclick="window.editarPeriodo(${p.id})">Edit.</button>
                      <button class="btn-icon-danger" onclick="window.eliminarPeriodo(${p.id})" ${disabled}>Del.</button>
                    </div>
                  </div>`;
            });

            // Actualizar UI Header
            if (activo) {
                if(activePeriodTitle) activePeriodTitle.textContent = activo.nombre;
                if(activePeriodTitle) activePeriodTitle.style.color = 'var(--accent-color)';
                if(activePeriodDates) activePeriodDates.textContent = `${activo.fechaInicio} ➝ ${activo.fechaFin}`;
                if(topBadge) topBadge.innerHTML = `<span class="dot"></span> ${activo.nombre} ACTIVO`;

                // Cargar conceptos
                const idCargar = seleccionActual || activo.id;
                periodSelector.value = idCargar;
                cargarConceptos(idCargar);
                
                // Actualizar fechas visuales del filtro
                const pFilter = listaGlobalPeriodos.find(x => x.id == idCargar);
                if(pFilter && periodDisplayDates) {
                    periodDisplayDates.innerHTML = `<span>${pFilter.fechaInicio}</span> <span class="arrow">➝</span> <span>${pFilter.fechaFin}</span>`;
                }
            }

        } catch (e) { console.error("Error periodos", e); }
    }

    if (periodSelector) {
        periodSelector.addEventListener('change', (e) => {
            cargarConceptos(e.target.value);
            const p = listaGlobalPeriodos.find(x => x.id == e.target.value);
            if(p && periodDisplayDates) periodDisplayDates.innerHTML = `<span>${p.fechaInicio}</span> <span class="arrow">➝</span> <span>${p.fechaFin}</span>`;
        });
    }

    window.editarPeriodo = (id) => {
      const p = listaGlobalPeriodos.find(x => x.id === id);
      if(!p) return;
      
      // Llenar datos en el modal
      document.getElementById('periodId').value = p.id; // ¡Importante!
      document.getElementById('periodName').value = p.nombre;
      document.getElementById('periodStart').value = p.fechaInicio;
      document.getElementById('periodEnd').value = p.fechaFin;
      
      // Cambiar título visualmente
      document.getElementById('periodModalTitle').textContent = "Editar Periodo";
      
      // Abrir modal
      const modal = document.getElementById('modalPeriodo');
      if(modal) modal.classList.add('active');
  };

    // ==========================================
    // 4. CARGAR CONCEPTOS
    // ==========================================
    async function cargarConceptos(periodoId) {
        if (!conceptsTable) return;
        conceptsTable.innerHTML = '<tr><td colspan="5" style="text-align:center">Cargando...</td></tr>';

        try {
            const res = await fetch(`/api/config/conceptos/${periodoId}`);
            listaGlobalConceptos = await res.json();

            conceptsTable.innerHTML = '';
            if (listaGlobalConceptos.length === 0) {
                conceptsTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999;">Sin conceptos.</td></tr>';
                return;
            }

            listaGlobalConceptos.forEach(c => {
                conceptsTable.innerHTML += `
                  <tr>
                    <td>${c.nombre}</td>
                    <td>${c.divisaId === 1 ? '$' : '€'}${c.montoDefault}</td>
                    <td>${c.fechaVencimiento}</td>
                    <td>${c.prorroga || 0} Días</td>
                    <td>
                      <div style="display:flex; gap:5px;">
                        <button class="btn-sm warning" onclick="window.editarConcepto(${c.id})">Editar</button>
                        <button class="btn-sm danger" onclick="window.borrarConcepto(${c.id}, ${periodoId})">🗑️</button>
                      </div>
                    </td>
                  </tr>`;
            });
        } catch (e) { console.error("Error conceptos", e); }
    }

    // ==========================================
    // 5. CARGAR CUENTAS
    // ==========================================
    // Modificamos la función para que acepte un parámetro 'silencioso'
  async function cargarDatosPago(silencioso = false) {
      if(!methodsList) return;
      
      // SOLO mostramos "Cargando..." si NO es silencioso (ej: primera carga)
      if (!silencioso) {
          methodsList.innerHTML = '<p style="padding:10px;">Cargando...</p>';
      }
      
      try {
          const res = await fetch('/api/config/cuentas');
          listaGlobalCuentas = await res.json();
          
          // Construimos el HTML en una variable primero
          let html = '';
          if(listaGlobalCuentas.length === 0) {
              html = '<p style="padding:10px; color:#999; text-align:center;">No hay cuentas configuradas.</p>';
          } else {
              listaGlobalCuentas.forEach(c => {
                  const activeClass = c.activo ? '' : 'inactive';
                  const checked = c.activo ? 'checked' : '';
                  
                  let detalle = c.banco || '';
                  if(c.tipo === 'PAGO_MOVIL') detalle += ` • ${c.telefono}`;
                  if(c.tipo === 'TRANSFERENCIA') detalle += ` • ${c.numeroCuenta ? c.numeroCuenta.slice(-4) : '****'}`;
                  
                  html += `
                    <div class="payment-item ${activeClass}">
                      <div class="pay-info">
                        <strong>${c.tipo.replace('_', ' ')}</strong>
                        <span style="font-size:0.85rem; color:#888;">${detalle}</span>
                      </div>
                      <div class="pay-actions" style="display:flex; gap:10px; align-items:center;">
                        <label class="toggle-switch">
                          <input type="checkbox" ${checked} onchange="window.toggleCuenta(${c.id})">
                          <span class="slider"></span>
                        </label>
                        <button class="btn-sm warning" style="padding:4px 8px; font-size:0.8rem;" onclick="window.editarCuenta(${c.id})">Editar</button>
                        <button class="btn-icon-danger" onclick="window.borrarCuenta(${c.id})">🗑️</button>
                      </div>
                    </div>
                  `;
              });
          }
          // Reemplazamos el contenido de golpe (sin parpadeo visible)
          methodsList.innerHTML = html;

      } catch(e) { console.error("Error cargando cuentas:", e); }
  }
    // ==========================================
    // 6. MANEJO DE MODALES (A prueba de errores)
    // ==========================================
    
    // Función segura para abrir modal
    function safeOpenModal(id) {
        const m = document.getElementById(id);
        if(m) m.classList.add('active');
        else console.error("No se encontró el modal:", id);
    }
    function safeCloseModal(id) {
        const m = document.getElementById(id);
        if(m) m.classList.remove('active');
    }

    // Conectar botones de apertura (Verificando que existan)
    const btnNewConcept = document.getElementById('btnNewConcept');
    if(btnNewConcept) btnNewConcept.addEventListener('click', () => {
        document.getElementById('formConcepto').reset();
        document.getElementById('conceptId').value = ''; 
        document.getElementById('conceptModalTitle').textContent = "Nuevo Concepto";
        safeOpenModal('modalConcepto');
    });

    const btnAddMethod = document.getElementById('btnAddMethod');
    if(btnAddMethod) btnAddMethod.addEventListener('click', () => {
        document.getElementById('formMetodo').reset();
        document.getElementById('methodId').value = '';
        document.getElementById('methodModalTitle').textContent = "Nuevo Método";
        if(methodTypeSelector) {
            methodTypeSelector.value = 'pago_movil';
            methodTypeSelector.dispatchEvent(new Event('change'));
        }
        safeOpenModal('modalMetodo');
    });

    // Botón Nuevo Periodo
  const btnAddPeriod = document.getElementById('btnAddPeriod');
  if(btnAddPeriod) {
      btnAddPeriod.addEventListener('click', () => {
          document.getElementById('formPeriodo').reset(); // Limpiar inputs
          document.getElementById('periodId').value = ''; // Quitar ID (para que cree uno nuevo)
          document.getElementById('periodModalTitle').textContent = "Nuevo Periodo";
          
          const modal = document.getElementById('modalPeriodo');
          if(modal) modal.classList.add('active');
      });
  }
    const btnForceRate = document.getElementById('btnForceRate');
    if(btnForceRate) btnForceRate.addEventListener('click', () => safeOpenModal('modalTasa'));

    // Conectar botones de cierre (Clase genérica)
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if(modal) modal.classList.remove('active');
        });
    });

    // Cerrar al click fuera
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.remove('active');
        });
    });


    // ==========================================
    // 7. LÓGICA FORMULARIOS (Guardar)
    // ==========================================

    // Formulario Concepto
    const formConcepto = document.getElementById('formConcepto');
    if(formConcepto) {
        formConcepto.addEventListener('submit', async (e) => {
            e.preventDefault();
            // 1. Detectar ID de moneda según el select
          const monedaSelect = document.getElementById('conceptCurrency').value; // USD o EUR
          const divisaId = (monedaSelect === 'EUR') ? 2 : 1; // Asumiendo 1=USD, 2=EUR en tu BD

            const payload = {
                id: document.getElementById('conceptId').value || null,
                periodoId: periodSelector.value,
                nombre: document.getElementById('conceptName').value,
                montoDefault: document.getElementById('conceptAmount').value,
                fechaVencimiento: document.getElementById('conceptDate').value,
                prorroga: document.getElementById('conceptGrace').value || 0,
                divisaId: divisaId, 
                activo: true
            };
            try {
                await fetch('/api/config/concepto', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
                safeCloseModal('modalConcepto');
                cargarConceptos(payload.periodoId);
                formConcepto.reset();
            } catch(err) { mostrarNotificacion("Error al guardar el concepto", "error"); }
        });
    }

    // Formulario Método
    const formMetodo = document.getElementById('formMetodo');
    const methodTypeSelector = document.getElementById('methodTypeSelector');
    const dynamicMethodFields = document.getElementById('dynamicMethodFields');

    // Actualizar campos dinámicos
    if(methodTypeSelector) {
        methodTypeSelector.addEventListener('change', () => {
            const tipo = methodTypeSelector.value.toUpperCase();
            let html = '';
            if (tipo === 'PAGO_MOVIL') {
                html = `<div class="form-group"><label>Banco</label><input type="text" required></div><div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;"><div class="form-group"><label>Teléfono</label><input type="text" required></div><div class="form-group"><label>Cédula/RIF</label><input type="text" required></div></div>`;
            } else if (tipo === 'TRANSFERENCIA') {
                html = `<div class="form-group"><label>Banco</label><input type="text" required></div><div class="form-group"><label>Cuenta</label><input type="text" required></div><div class="form-group"><label>Titular</label><input type="text" required></div><div class="form-group"><label>RIF</label><input type="text" required></div>`;
            } else {
                html = `<div class="form-group"><label>Detalles</label><input type="text"></div>`;
            }
            dynamicMethodFields.innerHTML = html;
        });
        // Init
        methodTypeSelector.dispatchEvent(new Event('change'));
    }

    if(formMetodo) {
        formMetodo.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputs = dynamicMethodFields.querySelectorAll('input');
            const tipo = methodTypeSelector.value.toUpperCase();
            
            // Recoger valores defensivamente
            let banco = inputs[0]?.value || '';
            let telf='', ident='', num='', titular='';

            if(tipo === 'PAGO_MOVIL') {
                telf = inputs[1]?.value || ''; ident = inputs[2]?.value || '';
            } else if (tipo === 'TRANSFERENCIA') {
                num = inputs[1]?.value || ''; titular = inputs[2]?.value || ''; ident = inputs[3]?.value || '';
            }

            const payload = {
                id: document.getElementById('methodId').value || null,
                tipo, banco, telefono: telf, identificador: ident, numeroCuenta: num, titular,
                instrucciones: document.getElementById('methodInst').value,
                activo: true
            };

            try {
                await fetch('/api/config/cuenta', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
                safeCloseModal('modalMetodo');
                cargarDatosPago();
                formMetodo.reset();
            } catch(err) { mostrarNotificacion("Error al guardar el método de pago", "error"); }
        });
    }

   // Formulario Periodo (Crear o Editar)
  const formPeriodo = document.getElementById('formPeriodo'); // Usamos ID directo ahora
  if(formPeriodo) {
      formPeriodo.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // Recoger datos
          const id = document.getElementById('periodId').value;
          const nombre = document.getElementById('periodName').value;
          const inicio = document.getElementById('periodStart').value;
          const fin = document.getElementById('periodEnd').value;

          // Si hay ID, mantenemos el estatus actual (lo buscamos en la lista global)
          // Si es nuevo, nace INACTIVO.
          let estatus = 'INACTIVO';
          if(id) {
              const pOriginal = listaGlobalPeriodos.find(x => x.id == id);
              if(pOriginal) estatus = pOriginal.estatus;
          }

          const payload = {
              id: id ? id : null, // Si es string vacío, manda null
              nombre: nombre,
              fechaInicio: inicio,
              fechaFin: fin,
              estatus: estatus
          };

          try {
              const res = await fetch('/api/config/periodo', { 
                  method: 'POST', 
                  headers: {'Content-Type': 'application/json'}, 
                  body: JSON.stringify(payload) 
              });
              
              if(res.ok) {
                  document.getElementById('modalPeriodo').classList.remove('active');
                  cargarPeriodos(); // Refrescar lista visual
                  formPeriodo.reset();
              } else {
                  mostrarNotificacion("Error al guardar periodo", "error");
              }
          } catch(err) { mostrarNotificacion("Error de red al guardar periodo", "error"); }
      });
  }

  // ==========================================
  // 6. LÓGICA DIVISA (BCV REAL)
  // ==========================================
  const btnUsd = document.getElementById('btnUsd');
  const btnEur = document.getElementById('btnEur');
  const labelTasa = document.getElementById('bcvValue');
  const labelSymbol = document.getElementById('bcvSymbol');
  const btnSync = document.getElementById('btnSyncBCV');
  const btnEdit = document.getElementById('btnEditRate');
  
  // Objeto para guardar las tasas en memoria
  let tasasGlobales = { USD: 0, EUR: 0 };
  let monedaActual = 'USD'; // Estado inicial

  // 1. CARGAR TASAS DESDE BD
  async function cargarTasas() {
      try {
          const res = await fetch('/api/config/tasas'); // Endpoint que devuelve lista de divisas
          const data = await res.json();
          
          const usdObj = data.find(d => d.codigo === 'USD');
          const eurObj = data.find(d => d.codigo === 'EUR');
          
          if(usdObj) tasasGlobales.USD = usdObj.tasa;
          if(eurObj) tasasGlobales.EUR = eurObj.tasa;

          actualizarVisualizacionTasa(); // Refrescar UI con los nuevos datos
      } catch(e) { console.error("Error cargando tasas", e); }
  }

  // 2. ACTUALIZAR UI
  function actualizarVisualizacionTasa() {
      if(monedaActual === 'USD') {
          labelTasa.textContent = tasasGlobales.USD.toFixed(2);
      } else {
          labelTasa.textContent = tasasGlobales.EUR.toFixed(2);
      }
      // Animación visual de actualización (opcional)
      labelTasa.style.opacity = 0;
      setTimeout(() => labelTasa.style.opacity = 1, 100);
  }

  // 3. CAMBIO DE TABS (USD / EUR)
  if(btnUsd && btnEur) {
      btnUsd.addEventListener('click', () => {
          monedaActual = 'USD';
          btnUsd.classList.add('active');
          btnEur.classList.remove('active');
          actualizarVisualizacionTasa();
      });

      btnEur.addEventListener('click', () => {
          monedaActual = 'EUR';
          btnEur.classList.add('active');
          btnUsd.classList.remove('active');
          actualizarVisualizacionTasa();
      });
  }

  // 4. BOTÓN SINCRONIZAR (FORZAR DESDE WEB)
  if(btnSync) {
      btnSync.addEventListener('click', async () => {
          const originalHTML = btnSync.innerHTML;
          btnSync.innerHTML = "Cargando..."; // Icono de carga
          btnSync.disabled = true;
          
          try {
              // Llamamos al scraper
              const res = await fetch('/api/config/tasas/forzar-bcv', { method: 'POST' });
              if(res.ok) {
                  await cargarTasas(); // Volvemos a pedir los datos a la BD (que ya estarán actualizados)
                  mostrarNotificacion("Tasas sincronizadas con el BCV", "exito");
              } else {
                  mostrarNotificacion("Error de conexión con el BCV", "error");
              }
          } catch(e) { console.error(e); }
          
          btnSync.innerHTML = originalHTML;
          btnSync.disabled = false;
      });
  }

  // Cargar al inicio
  cargarTasas();

  // ==========================================
  // 7. GUARDAR TASA MANUALMENTE
  // ==========================================
  const formTasa = document.getElementById('formTasa');
  
  if (formTasa) {
      formTasa.addEventListener('submit', async (e) => {
          e.preventDefault(); // Evita que la página se recargue
          
          const btnGuardar = formTasa.querySelector('button[type="submit"]');
          const originalText = btnGuardar.innerText;
          btnGuardar.innerText = "Guardando...";
          btnGuardar.disabled = true;

          // 1. Recoger datos del modal
          const codigo = document.getElementById('tasaCurrency').value;
          const valor = document.getElementById('tasaValue').value;

          try {
              // 2. Enviar al Backend
              const res = await fetch('/api/config/tasa', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ codigo: codigo, valor: valor })
              });

              if (res.ok) {
                  // 3. Actualizar UI inmediatamente
                  tasasGlobales[codigo] = parseFloat(valor);
                  
                  // Si la moneda editada es la que se está viendo, actualizar texto
                  const btnUsdActive = document.getElementById('btnUsd').classList.contains('active');
                  const monedaVisible = btnUsdActive ? 'USD' : 'EUR';
                  
                  // Forzar actualización visual si coincide
                  if(codigo === monedaVisible) {
                      document.getElementById('bcvValue').textContent = parseFloat(valor).toFixed(2);
                  }

                  // Cerrar modal
                document.getElementById('modalTasa').classList.remove('active');
                mostrarNotificacion("Tasa actualizada correctamente.", "exito");
            } else {
                mostrarNotificacion("Error al guardar en el servidor.", "error");
            }

        } catch (error) {
            console.error(error);
            mostrarNotificacion("Error de conexión.", "error");
        } finally {
            btnGuardar.innerText = originalText;
            btnGuardar.disabled = false;
    }
    });
}

});