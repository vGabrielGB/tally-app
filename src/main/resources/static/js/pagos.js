document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');

    // Validación de seguridad básica
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }

    // ==========================================
    // 1. CARGA DE DATOS (PARALELO)
    // ==========================================
    cargarInformacionFinanciera();
    cargarMetodosSidebar();
    cargarHistorialReciente(); 

    // ==========================================
    // 2. LOGICA TARJETA DEUDA ACTUAL
    // ==========================================
    async function cargarInformacionFinanciera() {
        try {
            const res = await fetch(`/api/estudiante/pagos-info?estudianteId=${userId}`);
            if (!res.ok) throw new Error("Error obteniendo deuda");
            const data = await res.json();

            // Guardar ID de la deuda para el formulario modal
            const inputId = document.getElementById('inputDeudaId');
            if (inputId && data.id) {
                inputId.value = data.id;
            }

            // --- VARIABLES FINANCIERAS ---
            const simbolo = data.simboloMoneda || '$';
            const tasa = (data.tasaAplicada && data.tasaAplicada > 0) ? data.tasaAplicada : 1;
            const deudaDolares = data.montoActual || 0;
            const saldoBilleteraBs = data.totalAbonado || 0; 

            // --- CÁLCULOS MATEMÁTICOS ---
            // 1. ¿Cuánto cubre mi billetera HOY en Divisa?
            const coberturaDolares = saldoBilleteraBs / tasa;
            
            // 2. ¿Cuánto falta HOY en Divisa?
            const restanteDolares = Math.max(0, deudaDolares - coberturaDolares);
            
            // 3. ¿Cuánto es eso en Bolívares para pagar hoy?
            const restanteBs = restanteDolares * tasa;

            // --- RENDERIZADO VISUAL ---
            setText('.payment-concept', data.conceptoActual || 'Al día');
            setText('.header-amount', `${simbolo}${deudaDolares.toFixed(2)}`);
            
            // Fecha de vencimiento
            if(data.fechaVencimientoActual) {
                const fechaVence = new Date(data.fechaVencimientoActual);
                // Ajuste de zona horaria simple para visualización
                fechaVence.setMinutes(fechaVence.getMinutes() + fechaVence.getTimezoneOffset());
                setText('.payment-due', `Cierre: ${fechaVence.toLocaleDateString()}`);
            }

            // CAJA DE DETALLES (Saldo a favor y Tasa)
            const labelAbonado = document.querySelectorAll('.detail-box .label')[0];
            const valAbonado = document.querySelectorAll('.detail-box .value')[0];
            
            if(labelAbonado) labelAbonado.textContent = "Tu Billetera";
            if(valAbonado) {
                valAbonado.textContent = `${saldoBilleteraBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs`;
                valAbonado.classList.add('value-positive');
            }

            const labelEquiv = document.querySelectorAll('.detail-box .label')[1];
            const valEquiv = document.querySelectorAll('.detail-box .value')[1];
            
            if(labelEquiv) labelEquiv.textContent = "Cubre (Aprox)";
            if(valEquiv) valEquiv.textContent = `${simbolo}${coberturaDolares.toFixed(2)}`;

            // Tasa BCV
            setText('.value-rate', tasa.toFixed(2));

            // TOTALES A PAGAR 
            setText('.value-due', `${simbolo}${restanteDolares.toFixed(2)}`);
            setText('.value-due-bs', `${restanteBs.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs`);

            // --- TARJETA "SIGUIENTE CUOTA" ---
            if (data.conceptoSiguiente) {
                setText('.next-concept', data.conceptoSiguiente);
                setText('.next-amount', `${simbolo}${data.montoSiguiente.toFixed(2)}`);
                setText('.next-date', `Vence: ${formatearFecha(data.fechaVencimientoSiguiente)}`);
                const lock = document.querySelector('.locked-status');
                if(lock) lock.style.display = 'block';
            } else {
                setText('.next-concept', 'Fin del ciclo');
                setText('.next-amount', '--');
                setText('.next-date', '');
                const lock = document.querySelector('.locked-status');
                if(lock) lock.style.display = 'none';
            }

            // --- PESTAÑAS DE BANCO PARA PAGAR ---
            renderizarPestañasBancos(data.cuentasBancarias);

        } catch (e) { console.error("Error cargando info financiera:", e); }
    }

    // ==========================================
    // 3. LOGICA HISTORIAL RECIENTE 
    // ==========================================
    async function cargarHistorialReciente() {
        try {
            const res = await fetch(`/api/pagos/historial/${userId}`);
            if(res.ok) {
                const lista = await res.json();
                
                // Contenedor en pagos.html
                const container = document.querySelector('.history-preview-wide');
                if (!container) return;

                const header = container.querySelector('.history-header');
                
                container.innerHTML = '';
                container.appendChild(header);

                if(!lista || lista.length === 0) {
                    container.insertAdjacentHTML('beforeend', '<p style="padding:1rem; color:#888; font-size:0.9rem;">No hay pagos recientes.</p>');
                    return;
                }

                // Tomamos el MÁS RECIENTE (índice 0)
                const p = lista[0];

                // Definir estilos según estatus
                let iconChar = '✓';
                let iconColor = '#4caf50'; // Verde
                let bgColor = 'rgba(76, 175, 80, 0.1)';

                if(p.estatus === 'PENDIENTE' || p.estatus === 'EN_REVISION') {
                    iconChar = '⏳';
                    iconColor = '#ff9800'; // Naranja
                    bgColor = 'rgba(255, 152, 0, 0.1)';
                } else if (p.estatus === 'RECHAZADO') {
                    iconChar = '✕';
                    iconColor = '#f44336'; // Rojo
                    bgColor = 'rgba(244, 67, 54, 0.1)';
                }

                const montoFmt = parseFloat(p.monto).toLocaleString('es-VE', {minimumFractionDigits: 2});

                // HTML Dinámico insertado
                const rowHtml = `
                    <div class="history-row-item" style="cursor: pointer;" onclick="location.href='historial.html'">
                        <div class="h-icon" style="background-color: ${bgColor}; color: ${iconColor}; display:flex; align-items:center; justify-content:center;">${iconChar}</div>
                        <div class="h-details">
                            <span class="h-concept">${p.concepto}</span>
                            <span class="h-date">${p.fecha || ''}</span>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            <span class="h-amount">Bs ${montoFmt}</span>
                            <span style="font-size:0.7rem; color:${iconColor}; text-transform:capitalize;">${p.estatus.toLowerCase()}</span>
                        </div>
                    </div>
                `;
                
                container.insertAdjacentHTML('beforeend', rowHtml);
            }
        } catch(e) { console.error("Error cargando historial en pagos:", e); }
    }

    // ==========================================
    // 4. MÉTODOS GUARDADOS (SIDEBAR)
    // ==========================================
    async function cargarMetodosSidebar() {
        const listContainer = document.getElementById('savedMethodsList');
        if (!listContainer) return;

        try {
            const res = await fetch(`/api/metodos/listar/${userId}`);
            const metodos = await res.json();

            listContainer.innerHTML = '';

            if (metodos.length === 0) {
                listContainer.innerHTML = '<p style="font-size:0.8rem; color:#999; text-align:center; padding:10px;">No tienes métodos guardados</p>';
            } else {
                metodos.forEach(m => {
                    const item = document.createElement('div');
                    item.className = 'method-item-vertical';
                    item.style.cursor = 'pointer';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';

                    const mString = encodeURIComponent(JSON.stringify(m));

                    item.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px; flex:1;" onclick="abrirModalConMetodo('${mString}')">
                            <div class="method-icon-small">${m.tipo === 'PAGO_MOVIL' ? '📱' : '🏦'}</div>
                            <div class="method-info-small">
                                <span class="method-name-small">${m.alias}</span>
                                <span class="method-sub-small">${m.banco}</span>
                            </div>
                        </div>
                        <button class="btn-delete-method" onclick="eliminarMetodo(${m.id})" title="Eliminar" style="background:none; border:none; color:#ff5252; font-weight:bold; cursor:pointer; padding:5px;">&times;</button>
                    `;
                    listContainer.appendChild(item);
                });
            }
        } catch (e) { console.error("Error cargando métodos", e); }
    }

    // ==========================================
    // 5. MODAL Y FORMULARIO
    // ==========================================
    const modal = document.getElementById('paymentModal');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const modalTitle = document.getElementById('modalTitle');
    const navBtn = document.getElementById('navActionBtn');
    
    const form = document.getElementById('payment-form');
    const hiddenTipo = document.getElementById('hiddenTipo');
    const toggleGuardar = document.getElementById('toggleGuardar');
    const groupAlias = document.getElementById('groupAlias');
    const wrapperGuardar = document.getElementById('wrapperGuardar');

    const inputFecha = document.getElementById('inputFecha');
    if (inputFecha) inputFecha.valueAsDate = new Date();

    // ABRIR MODAL (Botón Principal)
    const btnPagar = document.getElementById('payButtonActual');
    if (btnPagar) {
        btnPagar.addEventListener('click', () => {
            resetForm();
            step1.classList.add('active');
            step2.classList.remove('active');
            modalTitle.textContent = 'Seleccionar Opción';
            if (wrapperGuardar) wrapperGuardar.style.display = 'flex';
            modal.classList.add('active');
            navBtn.innerHTML = '&times;';
            navBtn.onclick = () => modal.classList.remove('active');
        });
    }

    // ABRIR MODAL (Método Guardado)
    window.abrirModalConMetodo = (mEncoded) => {
        const m = JSON.parse(decodeURIComponent(mEncoded));
        resetForm();
        irAlFormulario(m.tipo);

        modalTitle.textContent = m.alias;
        document.getElementById('inputBanco').value = m.banco || '';
        document.getElementById('inputCedula').value = m.cedula || '';

        const telf = document.getElementById('inputTelefono');
        const tit = document.getElementById('inputTitular');

        if (m.telefono && telf) telf.value = m.telefono;
        if (m.titular && tit) tit.value = m.titular;

        // Ocultar opción de guardar porque ya existe
        if (wrapperGuardar) wrapperGuardar.style.display = 'none';

        modal.classList.add('active');
        navBtn.innerHTML = '&times;';
        navBtn.onclick = () => modal.classList.remove('active');
    };

    // NAVEGACIÓN MODAL
    window.irAlFormulario = (tipo) => {
        hiddenTipo.value = tipo;
        const divTelf = document.getElementById('field-telefono');
        const divTit = document.getElementById('field-titular');
        const inTelf = document.getElementById('inputTelefono');
        const inTit = document.getElementById('inputTitular');

        if (tipo === 'PAGO_MOVIL') {
            if (modalTitle.textContent === 'Seleccionar Opción') modalTitle.textContent = 'Pago Móvil';
            if (divTelf) divTelf.style.display = 'block';
            if (divTit) divTit.style.display = 'none';
            if (inTelf) inTelf.setAttribute('required', 'true');
            if (inTit) inTit.removeAttribute('required');
        } else {
            if (modalTitle.textContent === 'Seleccionar Opción') modalTitle.textContent = 'Transferencia';
            if (divTelf) divTelf.style.display = 'none';
            if (divTit) divTit.style.display = 'block';
            if (inTit) inTit.setAttribute('required', 'true');
            if (inTelf) inTelf.removeAttribute('required');
        }

        step1.classList.remove('active');
        step2.classList.add('active');

        // Botón atrás si venimos del paso 1
        if (wrapperGuardar && wrapperGuardar.style.display !== 'none') {
            navBtn.innerHTML = '←';
            navBtn.onclick = irAtras;
        }
    };

    function irAtras() {
        step2.classList.remove('active');
        step1.classList.add('active');
        modalTitle.textContent = 'Seleccionar Opción';
        navBtn.innerHTML = '&times;';
        navBtn.onclick = () => modal.classList.remove('active');
    }

    if (toggleGuardar) {
        toggleGuardar.addEventListener('change', () => {
            groupAlias.style.display = toggleGuardar.checked ? 'block' : 'none';
        });
    }

    // ENVIAR FORMULARIO
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnReportar');
            const originalText = btn.innerText;
            btn.innerText = "Procesando..."; btn.disabled = true;

            const tipo = hiddenTipo.value;
            const banco = document.getElementById('inputBanco').value;
            const cedula = document.getElementById('inputCedula').value;
            const telf = document.getElementById('inputTelefono') ? document.getElementById('inputTelefono').value : '';
            const titular = document.getElementById('inputTitular') ? document.getElementById('inputTitular').value : '';

            // 1. Guardar Método (Si aplica)
            if (toggleGuardar && toggleGuardar.checked && wrapperGuardar.style.display !== 'none') {
                const alias = document.getElementById('inputAlias').value || banco;
                try {
                    await fetch('/api/metodos/guardar', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            usuarioId: userId, alias, tipo, banco, cedula, telefono: telf, titular
                        })
                    });
                    cargarMetodosSidebar(); // Recargar lista lateral
                } catch (err) { console.error(err); }
            }

            // 2. Registrar Pago
            const formData = new FormData();
            const deudaId = document.getElementById('inputDeudaId').value;
            
            // Validar que exista deuda ID
            if(!deudaId) {
                mostrarNotificacion("No se pudo registrar el pago. No hay deuda pendiente seleccionada.", "error");
                 btn.innerText = originalText; btn.disabled = false;
                 return;
            }

            formData.append('deuda_id', deudaId);
            formData.append('archivo', document.getElementById('inputArchivo').files[0]);
            formData.append('banco', banco);
            formData.append('referencia', document.getElementById('inputReferencia').value);
            formData.append('monto', document.getElementById('inputMonto').value);
            formData.append('fecha', inputFecha.value);
            formData.append('tipo', tipo);
            formData.append('cedula', cedula);
            if (tipo === 'PAGO_MOVIL') formData.append('telefono', telf);
            if (tipo === 'TRANSFERENCIA') formData.append('titular', titular);

            try {
                const res = await fetch('/api/pagos/registrar', { method: 'POST', body: formData });
                const result = await res.json();
                
                if (res.ok) {
                    mostrarNotificacion("✅ Pago registrado exitosamente", "exito");
                    modal.classList.remove('active');
                    cargarInformacionFinanciera();
                    cargarHistorialReciente();
                } else {
                    mostrarNotificacion("⚠️ " + (result.error || "Error registrando pago"), "error");
                }
            } catch (e) { 
                console.error(e);
                mostrarNotificacion("Error de conexión con el servidor", "error"); 
            }

            btn.innerText = originalText; btn.disabled = false;
        });
    }

    function resetForm() {
        form.reset();
        if (inputFecha) inputFecha.valueAsDate = new Date();
        if (toggleGuardar) toggleGuardar.checked = false;
        if (groupAlias) groupAlias.style.display = 'none';
    }

    // Funciones Auxiliares
    function setText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    }
});

// ==========================================
// 6. FUNCIONES GLOBALES (FUERA DE DOMContentLoaded)
// ==========================================

window.eliminarMetodo = async (id) => {
    if (confirm('¿Eliminar este método de pago?')) {
        try {
            await fetch(`/api/metodos/borrar/${id}`, { method: 'DELETE' });
            location.reload(); 
        } catch (e) { mostrarNotificacion("Error al eliminar método de pago", "error"); }
    }
};

window.switchBankTab = (tab) => {
    const contentPM = document.getElementById('data-pm');
    const contentTransf = document.getElementById('data-transf');
    const tabs = document.querySelectorAll('.bank-tab');
    if (!contentPM || !contentTransf) return;

    if (tab === 'pm') {
        contentPM.style.display = 'block';
        contentTransf.style.display = 'none';
        if (tabs[0]) tabs[0].classList.add('active');
        if (tabs[1]) tabs[1].classList.remove('active');
    } else {
        contentPM.style.display = 'none';
        contentTransf.style.display = 'block';
        if (tabs[0]) tabs[0].classList.remove('active');
        if (tabs[1]) tabs[1].classList.add('active');
    }
};

window.copiarTexto = (texto) => {
    navigator.clipboard.writeText(texto).then(() => { mostrarNotificacion("Texto copiado al portapapeles", "exito"); }).catch(() => { mostrarNotificacion("Error al copiar texto", "error"); });
};

// Renderizado dinámico de pestañas de banco (llamado desde cargarInformacionFinanciera)
function renderizarPestañasBancos(cuentas) {
    const containerTabs = document.querySelector('.bank-tabs');
    const containerInfo = document.querySelector('.bank-data-card');

    if (!containerTabs || !containerInfo) return;

    containerTabs.innerHTML = '';
    // Eliminar contenido viejo
    containerInfo.querySelectorAll('.bank-content').forEach(el => el.remove());

    if (!cuentas || cuentas.length === 0) {
        containerTabs.innerHTML = '<p style="font-size:0.8rem; color:#888;">No hay cuentas activas.</p>';
        return;
    }

    cuentas.forEach((c, index) => {
        // Tab Botón
        const btn = document.createElement('button');
        btn.className = `bank-tab ${index === 0 ? 'active' : ''}`;
        btn.textContent = c.tipo === 'PAGO_MOVIL' ? 'Pago Móvil' : 'Transf.';
        btn.onclick = () => window.switchDynamicTab(index);
        containerTabs.appendChild(btn);

        // Contenido
        const div = document.createElement('div');
        div.className = `bank-content ${index === 0 ? 'active' : ''}`;
        div.style.display = index === 0 ? 'block' : 'none';
        
        let html = `<div class="bank-row"><span class="bank-label">Banco:</span><span class="bank-val">${c.banco}</span></div>`;
        
        if (c.tipo === 'PAGO_MOVIL') {
            html += `
                <div class="bank-row"><span class="bank-label">RIF/CI:</span><div class="copy-wrapper"><span class="bank-val">${c.identificador}</span><button class="btn-copy" onclick="copiarTexto('${c.identificador}')">📋</button></div></div>
                <div class="bank-row"><span class="bank-label">Telf:</span><div class="copy-wrapper"><span class="bank-val highlight">${c.telefono}</span><button class="btn-copy" onclick="copiarTexto('${c.telefono}')">📋</button></div></div>`;
        } else {
            html += `
                <div class="bank-row"><span class="bank-label">Titular:</span><span class="bank-val">${c.titular}</span></div>
                <div class="bank-row"><span class="bank-label">RIF:</span><span class="bank-val">${c.identificador}</span></div>
                <div class="bank-row"><span class="bank-label">Cuenta:</span><div class="copy-wrapper"><span class="bank-val small-text">${c.numeroCuenta}</span><button class="btn-copy" onclick="copiarTexto('${c.numeroCuenta}')">📋</button></div></div>`;
        }
        div.innerHTML = html;
        containerInfo.appendChild(div);
    });
}

window.switchDynamicTab = (index) => {
    const btns = document.querySelectorAll('.bank-tab');
    const conts = document.querySelectorAll('.bank-content');
    
    btns.forEach((b, i) => i === index ? b.classList.add('active') : b.classList.remove('active'));
    conts.forEach((c, i) => {
        if(i === index) { c.classList.add('active'); c.style.display = 'block'; }
        else { c.classList.remove('active'); c.style.display = 'none'; }
    });
};

function formatearFecha(fechaStr) {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr + "T00:00:00");
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}