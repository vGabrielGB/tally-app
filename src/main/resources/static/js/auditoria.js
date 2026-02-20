document.addEventListener('DOMContentLoaded', () => {
  
  // --- VARIABLES ---
  const tableBody = document.getElementById('auditTableBody');
  const searchInput = document.getElementById('auditSearch');
  const typeFilter = document.getElementById('eventTypeFilter');
  const dateFrom = document.querySelectorAll('.audit-input[type="date"]')[0]; // Desde
  const dateTo = document.querySelectorAll('.audit-input[type="date"]')[1];   // Hasta
  
  // Paginación
  const rowsPerPage = 10;
  let currentPage = 1;
  let logsData = []; // Todos los datos cargados
  let filteredData = []; // Datos después de filtrar

  // --- 1. CARGA INICIAL ---
  init();

  async function init() {
      await cargarAuditoria();

  }

  async function cargarAuditoria() {
    try {
        const res = await fetch('/api/auditoria/listar'); //  endpoint en AuditoriaController
        if(res.ok) {
            logsData = await res.json();
            // Ordenar por fecha descendente (más nuevo primero)
            logsData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            filteredData = logsData;
            renderTable();
        }
    } catch(e) {
        console.error("Error auditoría:", e);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error de conexión</td></tr>`;
    }
  }

  // --- 2. RENDERIZADO Y PAGINACIÓN ---
  function renderTable() {
    tableBody.innerHTML = '';

    // Calcular Paginación
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
    
    // Validar página actual
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Recortar datos
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);

    // Actualizar Info de Paginación
    const infoSpan = document.querySelector('.page-info');
    if (infoSpan) infoSpan.textContent = `Mostrando ${start + 1}-${Math.min(end, totalItems)} de ${totalItems} registros`;

    // Renderizar Filas
    if (pageData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-secondary);">No se encontraron registros.</td></tr>`;
      return;
    }

    pageData.forEach(log => {
      // Fecha
      const d = new Date(log.fecha);
      const fechaStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      // Estilos
      let badgeClass = 'log-info';
      let accionCorta = 'Acción';
      
      // Lógica de alineación y contenido
      let objetivo = '-'; 
      let detalleTecnico = log.accion; // Por defecto todo es detalle

      if (log.accion.includes('APROBADO')) { 
          badgeClass = 'log-success'; 
          accionCorta = 'Aprobado';
          objetivo = 'Pago';
      }
      else if (log.accion.includes('RECHAZADO')) { 
          badgeClass = 'log-danger'; 
          accionCorta = 'Rechazado'; 
          objetivo = 'Pago';
      }
      else if (log.accion.includes('Registró')) { 
          badgeClass = 'log-warning'; 
          accionCorta = 'Registro';
          objetivo = 'Usuario';
      }

      tableBody.innerHTML += `
        <tr>
          <td class="log-date" style="white-space:nowrap;">${fechaStr}</td>
          <td>
            <div style="display:flex; flex-direction:column;">
                <span class="log-user" style="font-weight:600;">${log.usuario || 'Sistema'}</span>
                <span class="log-role" style="font-size:0.75rem; color:#888;">${log.rol || 'AUTO'}</span>
            </div>
          </td>
          <td class="col-center"><span class="log-badge ${badgeClass}">${accionCorta}</span></td>
          <td>${objetivo}</td> 
          <td style="max-width: 300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            <span title="${detalleTecnico}">${detalleTecnico}</span>
          </td>
        </tr>
      `;
    });

    actualizarBotonesPaginacion(totalPages);
  }

  function actualizarBotonesPaginacion(totalPages) {
      const container = document.querySelector('.pagination-controls');
      if(!container) return;
      
      container.innerHTML = '';

      // Botón Anterior
      const btnPrev = document.createElement('button');
      btnPrev.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
      btnPrev.innerText = '<';
      btnPrev.onclick = () => { if(currentPage > 1) { currentPage--; renderTable(); }};
      container.appendChild(btnPrev);

      // Botón Página Actual (Simplificado)
      const btnNum = document.createElement('button');
      btnNum.className = 'page-btn active';
      btnNum.innerText = currentPage;
      container.appendChild(btnNum);

      // Botón Siguiente
      const btnNext = document.createElement('button');
      btnNext.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
      btnNext.innerText = '>';
      btnNext.onclick = () => { if(currentPage < totalPages) { currentPage++; renderTable(); }};
      container.appendChild(btnNext);
  }

  // --- 3. FILTROS ---
  function aplicarFiltros() {
      const texto = searchInput.value.toLowerCase();
      const tipo = typeFilter.value;
      const fechaInicio = dateFrom.value ? new Date(dateFrom.value) : null;
      const fechaFin = dateTo.value ? new Date(dateTo.value) : null;

      filteredData = logsData.filter(log => {
          // Filtro Texto
          const matchTexto = (log.usuario && log.usuario.toLowerCase().includes(texto)) || 
                             (log.accion && log.accion.toLowerCase().includes(texto));
          
          // Filtro Tipo (Aproximado)
          let matchTipo = true;
          if (tipo === 'Pago') matchTipo = log.accion.toLowerCase().includes('pago');
          if (tipo === 'Seguridad') matchTipo = log.accion.toLowerCase().includes('acceso') || log.accion.toLowerCase().includes('login');
          
          // Filtro Fecha
          let matchFecha = true;
          if (fechaInicio || fechaFin) {
              const logDate = new Date(log.fecha);
              // Ajustar fin de día para fechaHasta
              if (fechaFin) fechaFin.setHours(23, 59, 59);
              
              if (fechaInicio && logDate < fechaInicio) matchFecha = false;
              if (fechaFin && logDate > fechaFin) matchFecha = false;
          }

          return matchTexto && matchTipo && matchFecha;
      });

      currentPage = 1; // Resetear a página 1 al filtrar
      renderTable();
  }

  // Listeners de Filtros
  searchInput.addEventListener('input', aplicarFiltros);
  typeFilter.addEventListener('change', aplicarFiltros);
  dateFrom.addEventListener('change', aplicarFiltros);
  dateTo.addEventListener('change', aplicarFiltros);


  // --- 4. FEEDBACK (CONECTADO AL BACKEND) ---
  const feedbackModal = document.getElementById('modalFeedback');
  const btnFeedback = document.getElementById('btnViewFeedback');
  const closeFeedback = document.getElementById('closeFeedback');
  const feedbackBody = document.getElementById('feedbackTableBody');

  if(btnFeedback) {
    btnFeedback.addEventListener('click', async () => {
      feedbackModal.classList.add('active');
      feedbackBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>';
      
      try {
          // LLAMADA REAL AL BACKEND
          const res = await fetch('/api/feedback/listar');
          if(res.ok) {
              const feedbacks = await res.json();
              renderFeedbackTable(feedbacks);
          } else {
              feedbackBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error cargando feedback</td></tr>';
          }
      } catch(e) {
          console.error(e);
          feedbackBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error de conexión</td></tr>';
      }
    });
  }

  function renderFeedbackTable(lista) {
      feedbackBody.innerHTML = '';
      if(lista.length === 0) {
          feedbackBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay comentarios.</td></tr>';
          return;
      }

      lista.forEach(f => {
          const d = new Date(f.fechaEnviado);
          const fechaStr = d.toLocaleDateString();
          
          feedbackBody.innerHTML += `
            <tr>
              <td>${fechaStr}</td>
              <td><strong>${f.tipo}</strong></td>
              <td>${f.comentario}</td>
              <td><span class="badge badge-verificador">Recibido</span></td>
            </tr>
          `;
      });
  }

  if(closeFeedback) {
    closeFeedback.addEventListener('click', () => feedbackModal.classList.remove('active'));
    // Cerrar con click fuera
    window.addEventListener('click', (e) => {
        if(e.target === feedbackModal) feedbackModal.classList.remove('active');
    });
  }
});