document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. CONFIGURACIÓN INICIAL ---
    const searchInput = document.querySelector('.search-input');
    const dateBadge = document.getElementById('currentDateBadge');
    
    if(dateBadge) {
        const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
        dateBadge.textContent = "Hoy: " + new Date().toLocaleDateString('es-ES', opciones);
    }

    let todosLosPagos = [];
    let todosLosEstudiantes = [];

    // --- 2. CARGAR DATOS ---
    await cargarEstudiantes();
    await cargarPagosPendientes();

    // --- 3. BUSCADOR ---
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase();
            
            // Filtrar Pagos
            const pagosFiltrados = todosLosPagos.filter(p => 
                (p.nombre && p.nombre.toLowerCase().includes(termino)) ||
                (p.cedula && p.cedula.includes(termino)) ||
                (p.numero_referencia && p.numero_referencia.includes(termino))
            );
            renderizarPagos(pagosFiltrados);

            // Filtrar Estudiantes
            const estFiltrados = todosLosEstudiantes.filter(est => 
                (est.nombre && est.nombre.toLowerCase().includes(termino)) ||
                (est.cedula && est.cedula.includes(termino))
            );
            renderizarEstudiantes(estFiltrados);
        });
    }

    // --- FUNCIONES ---

    async function cargarEstudiantes() {
        try {
            const res = await fetch('/api/usuarios/estudiantes');
            if(res.ok) {
                todosLosEstudiantes = await res.json();
                renderizarEstudiantes(todosLosEstudiantes);
            }
        } catch(e) { console.error("Error estudiantes:", e); }
    }

    function renderizarEstudiantes(lista) {
        const container = document.querySelector('.estudiantes-list');
        if(!container) return;
        
        container.innerHTML = '';
        lista.forEach(est => {
            const datosEst = encodeURIComponent(JSON.stringify(est));

            // Lógica de colores (Badges)
            let claseEstatus = 'status-badge-pendiente'; // Amarillo por defecto
            let texto = est.estatus || 'PENDIENTE';

            if(texto === 'INSCRITO' || texto === 'SOLVENTE') {
                claseEstatus = 'status-badge-inscrito'; // Verde
            } else if (texto === 'MOROSO') {
                claseEstatus = 'status-badge-moroso'; // Rojo
            }

            // Foto o placeholder
            let avatarHtml;
            if (est.fotoPerfil) {
                const ruta = est.fotoPerfil.startsWith('/') ? est.fotoPerfil : `/${est.fotoPerfil}`;
                avatarHtml = `<img src="${ruta}" alt="avatar" style="width:48px; height:48px; border-radius:50%; object-fit:cover; margin-right:10px;">`;
            } else {
                const inicial = (est.nombre && est.nombre.length) ? est.nombre.charAt(0).toUpperCase() : '?';
                avatarHtml = `<div style="width:48px; height:48px; border-radius:50%; background:#e0e0e0; display:flex; align-items:center; justify-content:center; font-weight:700; color:#555; margin-right:10px;">${inicial}</div>`;
            }

            container.innerHTML += `
                <div class="estudiante-item" onclick="verInfoEstudiante('${datosEst}')" style="cursor: pointer; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    ${avatarHtml}
                    <div class="estudiante-info">
                      <p class="estudiante-name" style="margin:0;">
                          <strong>${est.nombre} ${est.apellido}</strong><br>
                          <span style="font-size:0.8rem; color:#666;">${est.cedula}</span>
                      </p>
                    </div>
                  </div>
                  <span class="${claseEstatus}">${texto}</span>
                </div>`;
        });
    }

    async function cargarPagosPendientes() {
        try {
            const res = await fetch('/api/pagos/pendientes');
            if(res.ok) {
                todosLosPagos = await res.json();
                renderizarPagos(todosLosPagos);
            }
        } catch(e) { console.error("Error pagos:", e); }
    }

    function renderizarPagos(lista) {
        const container = document.querySelector('.cuotas-list');
        if(!container) return;

        const banner = container.querySelector('.alert-banner p');
        if(banner) banner.textContent = `Tienes (${lista.length}) pagos pendientes para la revisión`;
        
        // Mantener el banner, limpiar el resto
        const existingBanner = container.querySelector('.alert-banner');
        container.innerHTML = '';
        if(existingBanner) container.appendChild(existingBanner);
        
        if(lista.length === 0) {
            container.insertAdjacentHTML('beforeend', `<p style="text-align:center; padding:2rem; color:#888;">No hay pagos pendientes.</p>`);
        } else {
            lista.forEach(p => {
                const datosString = encodeURIComponent(JSON.stringify(p));
                const nombre = p.nombre ? `${p.nombre} ${p.apellido}` : "Estudiante";
                
                const card = `
                <div class="cuota-card" onclick="abrirModalDetalle('${datosString}')" style="cursor: pointer;">
                    <div class="cuota-header">
                      <h3 class="cuota-title">${nombre}</h3>
                      <span class="cuota-action-btn" style="font-size:0.7rem;">Verificar</span>
                    </div>
                    <div class="cuota-content">
                      <p class="cuota-text"><span class="label">Cédula:</span> <span class="value">${p.cedula}</span></p>
                      <p class="cuota-text"><span class="label">Monto:</span> <span class="value" style="color: green; font-weight:bold;">${p.monto_pagado_bs.toLocaleString('es-VE')} Bs</span></p>
                      <p class="cuota-text"><span class="label">Banco:</span> <span class="value">${p.banco_origen}</span></p>
                    </div>
                </div>`;
                container.insertAdjacentHTML('beforeend', card);
            });
        }
    }
});

// --- FUNCIONES GLOBALES (MODALES) ---

// 1. VER DETALLE ESTUDIANTE (Corregido Foto y Extensión)
window.verInfoEstudiante = (datosString) => {
    const est = JSON.parse(decodeURIComponent(datosString));
    const modalEst = document.getElementById('estudianteModal');
    const content = document.getElementById('infoEstudianteContent');
    
    // Lógica Foto de Perfil
    let avatarHtml;
    if (est.fotoPerfil) {
        // Aseguramos ruta correcta
        const ruta = est.fotoPerfil.startsWith('/') ? est.fotoPerfil : `/${est.fotoPerfil}`;
        avatarHtml = `<img src="${ruta}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid var(--accent-color);">`;
    } else {
        avatarHtml = `
            <div style="width:80px; height:80px; background:#e0e0e0; border-radius:50%; margin:0 auto; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:bold; color:#555;">
                ${est.nombre.charAt(0)}
            </div>`;
    }

    content.innerHTML = `
        <div style="text-align:center; margin-bottom:1.5rem;">
            <div style="margin:0 auto; width: fit-content; margin-bottom: 10px;">
                ${avatarHtml}
            </div>
            <h3 style="margin: 0;">${est.nombre} ${est.apellido}</h3>
            <p style="color:#666; margin:0;">${est.cedula}</p>
            <span class="status-badge-inscrito" style="display:inline-block; margin-top:5px; font-size:0.8rem;">${est.estatus}</span>
        </div>
        <div class="detail-grid">
            <div class="detail-group"><span class="detail-label">Email</span><span class="detail-val" style="word-break:break-all;">${est.email}</span></div>
            <div class="detail-group"><span class="detail-label">Carrera</span><span class="detail-val">${est.carrera || 'N/A'}</span></div>
            <div class="detail-group"><span class="detail-label">Extensión</span><span class="detail-val">${est.extension || 'Sin asignar'}</span></div>
            <div class="detail-group"><span class="detail-label">Teléfono</span><span class="detail-val">${est.telefono || 'N/A'}</span></div>
        </div>
    `;
    modalEst.classList.add('active');
};

// 2. VER DETALLE PAGO (Verificar)
let pagoSeleccionadoId = null;
window.abrirModalDetalle = (datosString) => {
    const p = JSON.parse(decodeURIComponent(datosString));
    pagoSeleccionadoId = p.id;
    
    const detalleDiv = document.getElementById('detallePagoContent');
    const rutaImagen = p.url_archivo ? (p.url_archivo.startsWith('/') ? p.url_archivo : `/${p.url_archivo}`) : null;
    const nombre = p.nombre ? `${p.nombre} ${p.apellido}` : "Estudiante";

    detalleDiv.innerHTML = `
        <div class="detail-grid">
            <div class="detail-group"><span class="detail-label">Estudiante</span><span class="detail-val">${nombre}</span></div>
            <div class="detail-group"><span class="detail-label">Cédula</span><span class="detail-val">${p.cedula}</span></div>
            <div class="detail-group"><span class="detail-label">Banco</span><span class="detail-val">${p.banco_origen}</span></div>
            <div class="detail-group"><span class="detail-label">Ref</span><span class="detail-val">${p.numero_referencia}</span></div>
            <div class="detail-group"><span class="detail-label">Monto</span><span class="detail-val" style="color:#4CAF50; font-weight:bold;">${p.monto_pagado_bs.toLocaleString('es-VE')} Bs</span></div>
        </div>
        <div class="img-preview-container" style="margin-top: 1rem; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 8px;">
            ${ rutaImagen ? `<a href="${rutaImagen}" target="_blank"><img src="${rutaImagen}" style="max-width: 100%; max-height: 400px; border-radius: 4px;"></a><br><small>Clic para ver original</small>` : `<p>⚠️ Sin comprobante</p>` }
        </div>
    `;
    document.getElementById('verificarModal').classList.add('active');
};

// Lógica de Aprobar/Rechazar
window.procesarPago = async (estatus) => {
    if(!pagoSeleccionadoId) return;
    
    let motivo = null;
    if (estatus === 'RECHAZADO') {
        motivo = prompt("Motivo del rechazo:");
        if (motivo === null) return;
        if (motivo.trim() === "") motivo = "Datos inconsistentes";
    }

    const btn = estatus === 'APROBADO' ? document.getElementById('btnAprobar') : document.getElementById('btnRechazar');
    const txt = btn.innerText;
    btn.innerText = "..."; btn.disabled = true;

    try {
        await fetch('/api/pagos/procesar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: pagoSeleccionadoId, estatus, motivo })
        });
        document.getElementById('verificarModal').classList.remove('active');
        location.reload(); 
    } catch(e) { mostrarNotificacion("No se pudo subir la imagen", "error"); }
    
    btn.innerText = txt; btn.disabled = false;
};

// Event Listeners
document.getElementById('closeEstudianteModal').addEventListener('click', () => document.getElementById('estudianteModal').classList.remove('active'));
document.getElementById('closeVerificarModal').addEventListener('click', () => document.getElementById('verificarModal').classList.remove('active'));
document.getElementById('btnAprobar').addEventListener('click', () => procesarPago('APROBADO'));
document.getElementById('btnRechazar').addEventListener('click', () => procesarPago('RECHAZADO'));

window.addEventListener('click', (e) => {
    if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
});