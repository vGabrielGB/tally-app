document.addEventListener('DOMContentLoaded', () => {
    
    const userId = localStorage.getItem('userId');
    let currentCurrencySymbol = '$'; 

    // ==========================================
    // 1. CARGA DE DATOS
    // ==========================================
    
    document.addEventListener('usuarioListo', (e) => {
        actualizarPerfilDashboard(e.detail);
    });

    if (userId) {

        cargarDatosFinancieros(userId); // Deudas y Reloj
        cargarPerfilYEstatus(userId);   // Foto y Solvencia
        cargarUltimoPago(userId);       // Historial reciente
    }

    async function cargarUltimoPago(id) {
        try {
            const res = await fetch(`/api/pagos/historial/${id}`);
            if (res.ok) {
                const historial = await res.json();
                const ultimoPago = (historial && historial.length > 0) ? historial[0] : null;
                actualizarTarjetaHistorial(ultimoPago);
            }
        } catch (e) {
            console.error("Error cargando historial reciente:", e);
        }
    }

    async function cargarPerfilYEstatus(id) {
        try {
            const res = await fetch(`/api/estudiante/dashboard/${id}`);
            if (res.ok) {
                const data = await res.json();
                actualizarPerfilDashboard(data);
            }
        } catch (e) { console.error("Error cargando perfil:", e); }
    }

    async function cargarDatosFinancieros(id) {
        try {
            const res = await fetch(`/api/estudiante/pagos-info?estudianteId=${userId}`);
            if (!res.ok) throw new Error("Error API");
            
            const data = await res.json();
            currentCurrencySymbol = data.simboloMoneda || '$';
            
            renderizarDashboard(data);
            
        } catch (error) {
            console.error("Error dashboard:", error);
        }
    }

    // ==========================================
    // 2. RENDERIZADO DEL DASHBOARD
    // ==========================================
    function renderizarDashboard(data) {
        // A. Configurar Calculadora (Tasas Globales)
        const rateUSD = parseFloat(data.tasaDolar || 0);
        const rateEUR = parseFloat(data.tasaEur || 0);

        if (rateUSD > 0 && rateEUR > 0) {
            configurarCalculadora(rateUSD, rateEUR);
        }
        
        // B. Variables de la Deuda 
 
        const simboloDb = data.simboloMoneda || '$';
        const tasa = (data.tasaAplicada && parseFloat(data.tasaAplicada) > 0) ? parseFloat(data.tasaAplicada) : 1;
        
        // C. Cálculos
        const montoTotalDeuda = parseFloat(data.montoActual || 0);
        const abonadoBs = parseFloat(data.totalAbonado || 0); 
        const abonadoDivisa = abonadoBs / tasa; // Ahora 'tasa' sí existe
        const restante = Math.max(0, montoTotalDeuda - abonadoDivisa);
        
        // --- INFO DEUDA ---
        const cardPago = document.querySelectorAll('.card-info')[0]; 
        if (cardPago) {
            const fechaCierre = data.fechaVencimientoActual || "N/A";
            
            cardPago.querySelector('.card-title').innerHTML = `
                ${data.conceptoActual} 
                <span style="font-size: 0.65em; color: #888; font-weight: normal; margin-left: 5px; white-space: nowrap;">
                    (Cierra: ${fechaCierre})
                </span>
            `;

            const statusText = cardPago.querySelector('.card-text'); 
            
            if (statusText) {
                if (montoTotalDeuda === 0) {
                    statusText.textContent = "¡Estás al día!";
                    statusText.style.color = "#4caf50"; 
                } else if (restante <= 0.01) {
                    statusText.textContent = `Abonado: ${simboloDb}${abonadoDivisa.toFixed(2)}`;
                    statusText.style.color = "#4caf50"; 
                } else if (abonadoBs > 0) {
                    statusText.textContent = `Abonado: ${simboloDb}${abonadoDivisa.toFixed(2)}`; 
                    statusText.style.color = "#fbc02d"; 
                } else {
                    statusText.textContent = "Pago pendiente";
                    statusText.style.color = "#f44336"; 
                }
            }
            
            const spanMonto = cardPago.querySelector('.card-text-split span:nth-child(1)');
            if(spanMonto) spanMonto.textContent = `Restante: ${simboloDb}${restante.toFixed(2)}`;
            
            const spanTasa = cardPago.querySelector('.tasa-bcv');
            if(spanTasa) spanTasa.textContent = `Tasa: ${tasa.toFixed(2)}`;
            
            const pTotalBs = cardPago.querySelector('p.card-text:last-child');
            const deudaEnBs = restante * tasa;
            if(pTotalBs) pTotalBs.textContent = `Pagar hoy: Bs ${deudaEnBs.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }

        // --- TARJETA 2: RELOJ ---
        if (data.fechaVencimientoActual) {
            iniciarCuentaRegresiva(data.fechaVencimientoActual);
        } else {
            const timerSub = document.querySelector('.timer-subtitle');
            if(timerSub) timerSub.textContent = "Sin fecha límite";
        }

        // --- TARJETA 3: BARRA PROGRESO ---
        const progressTitle = document.querySelector('.progress-card .card-title');
        if(progressTitle) progressTitle.textContent = "Meta de la Cuota";

        actualizarBarraProgreso(abonadoDivisa, montoTotalDeuda, simboloDb);

        // --- EXTRAS ---
        const dashboardBankCard = document.querySelector('.bank-data-card');
        // Como el código ya no falla arriba, esta línea ahora sí se ejecutará:
        if (dashboardBankCard && data.cuentasBancarias) construirTabsBancosExactos(dashboardBankCard, data.cuentasBancarias);
    }

    // ==========================================
    // UTILS VISUALES
    // ==========================================

    function actualizarTarjetaHistorial(pago) {
        const card = document.querySelectorAll('.card-info')[1]; 
        if (!card) return;

        const iconContainer = card.querySelector('.card-icon');
        if(iconContainer) iconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path></svg>`;
        
        const content = card.querySelector('.card-content');
        if(content) {
            let concepto = "Sin movimientos";
            let estadoHtml = "";
            
            if (pago) {
                concepto = pago.concepto; 
                const est = pago.estatus; 
                let color = "#999";
                if(est === 'APROBADO') color = "#4caf50";
                if(est === 'PENDIENTE' || est === 'EN_REVISION') color = "#fbc02d";
                if(est === 'RECHAZADO') color = "#f44336";

                const estatusLindo = est.charAt(0).toUpperCase() + est.slice(1).toLowerCase().replace('_', ' ');
                estadoHtml = `<span style="color:${color}; font-weight:bold;">${estatusLindo}</span>`;
            }

            content.innerHTML = `
                <h3 class="card-title" style="margin-bottom:0.5rem;">Historial Reciente</h3>
                <div id="mini-history-list" style="font-size:0.85rem; color:var(--text-secondary);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid var(--border-color); padding-bottom:5px;">
                        <span style="max-width: 60%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${concepto}
                        </span> 
                        ${estadoHtml}
                    </div>
                </div>
                <a href="historial.html" style="font-size:0.8rem; color:var(--accent-color); text-decoration:none; margin-top:5px; display:block;">Ver historial completo →</a>
            `;
        }
    }

    function actualizarBarraProgreso(abonado, total, simbolo) {
        let porc = 0;
        if (total > 0) porc = (abonado / total) * 100;
        else if (total === 0 && abonado === 0) porc = 100;
        if(porc > 100) porc = 100;

        const barra = document.querySelector('.progress-bar-fill');
        const txtPagado = document.querySelector('.progress-card span:nth-child(1)');
        const txtPorc = document.querySelector('.progress-card span:nth-child(2)');
        const txtTotal = document.querySelector('.progress-card p');

        if(barra) barra.style.width = `${porc}%`;
        if(txtPagado) txtPagado.textContent = `Pagado: ${simbolo}${abonado.toFixed(2)}`;
        if(txtPorc) txtPorc.textContent = `${porc.toFixed(0)}%`;
        if (porc >= 100 && barra) barra.style.backgroundColor = "#4caf50"; 
        else if (barra) barra.style.backgroundColor = "var(--accent-color)";
        if(txtTotal) txtTotal.textContent = `Total Cuota: ${simbolo}${total.toFixed(2)}`;
    }

    let intervaloCuentaRegresiva;
    function iniciarCuentaRegresiva(fechaString) {
        const display = document.querySelector('.timer-subtitle');
        if (!display) return;
        if (intervaloCuentaRegresiva) clearInterval(intervaloCuentaRegresiva);
        const fechaVence = new Date(fechaString + "T23:59:59").getTime();
        const actualizar = () => {
            const ahora = new Date().getTime();
            const distancia = fechaVence - ahora;
            if (distancia < 0) {
                clearInterval(intervaloCuentaRegresiva);
                display.textContent = "VENCIDO"; display.style.color = "#f44336"; return;
            }
            const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
            const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
            display.textContent = `${dias}d : ${horas}h : ${minutos}m`; display.style.color = ""; 
        };
        actualizar(); intervaloCuentaRegresiva = setInterval(actualizar, 60000); 
    }

    function actualizarPerfilDashboard(data) {
        const welcomeTitle = document.querySelector('.welcome-title');
        if(welcomeTitle) welcomeTitle.textContent = `¡Bienvenido, ${data.nombre}!`;
        const img = document.querySelector('.qr-display-container img');
        const txt = document.querySelector('.qr-cedula');
        if (img && data.cedula) {
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=V-${data.cedula}&color=3f51b5`;
            if(txt) txt.textContent = `V-${data.cedula}`;
        }
        const badges = [document.getElementById('welcomeStatusBadge'), document.getElementById('sidebarStatusBadge')];
        badges.forEach(badge => {
            if (badge && data.estatusTexto) {
                badge.textContent = data.estatusTexto;
                badge.style = ""; badge.className = badge.id === 'sidebarStatusBadge' ? 'status-badge' : 'status-tag';
                if(data.estatusTexto === 'SOLVENTE') { badge.classList.add('status-solvente'); badge.style.backgroundColor = '#e8f5e9'; badge.style.color = '#2e7d32'; badge.style.borderColor = '#a5d6a7'; }
                else if (data.estatusTexto === 'PENDIENTE') { badge.style.backgroundColor = '#fff8e1'; badge.style.color = '#f57f17'; badge.style.border = '1px solid #ffe082'; }
                else if (data.estatusTexto === 'MOROSO') { badge.style.backgroundColor = '#ffebee'; badge.style.color = '#c62828'; badge.style.border = '1px solid #ffcdd2'; }
                else if (data.estatusTexto === 'EN REVISIÓN') { badge.style.backgroundColor = '#e3f2fd'; badge.style.color = '#1565c0'; badge.style.border = '1px solid #90caf9'; }
            }
        });
    }

    function construirTabsBancosExactos(container, cuentas) {
        container.className = 'card bank-data-card'; container.style.flexDirection = 'column'; container.style.padding = '1.5rem'; container.style.gap = '0'; container.innerHTML = '';
        if (!cuentas || cuentas.length === 0) { container.innerHTML = '<h3 class="sidebar-title">Datos para Pagos</h3><p style="padding:1rem;">No hay cuentas.</p>'; return; }
        let html = `<h3 class="sidebar-title" style="margin-bottom: 1rem;">Datos para Pagos</h3><div class="bank-tabs">`;
        cuentas.forEach((c, index) => { const active = index === 0 ? 'active' : ''; const label = c.tipo === 'PAGO_MOVIL' ? 'Pago Móvil' : 'Transf.'; html += `<button class="bank-tab ${active}" onclick="switchBankTabDash(${index})">${label}</button>`; });
        html += `</div>`;
        cuentas.forEach((c, index) => {
            const active = index === 0 ? 'active' : ''; const style = index === 0 ? 'block' : 'none';
            html += `<div id="bank-dash-${index}" class="bank-content ${active}" style="display: ${style}; margin-top: 1rem;"><div class="bank-row"><span class="bank-label">Banco:</span><span class="bank-val">${c.banco}</span></div>`;
            if (c.tipo === 'PAGO_MOVIL') { html += `<div class="bank-row"><span class="bank-label">RIF/CI:</span><div class="copy-wrapper"><span class="bank-val">${c.identificador}</span><button class="btn-copy" onclick="copiar('${c.identificador}')">📋</button></div></div><div class="bank-row"><span class="bank-label">Telf:</span><div class="copy-wrapper"><span class="bank-val highlight">${c.telefono}</span><button class="btn-copy" onclick="copiar('${c.telefono}')">📋</button></div></div>`; } 
            else { html += `<div class="bank-row"><span class="bank-label">Titular:</span><span class="bank-val">${c.titular}</span></div><div class="bank-row"><span class="bank-label">RIF:</span><div class="copy-wrapper"><span class="bank-val">${c.identificador}</span><button class="btn-copy" onclick="copiar('${c.identificador}')">📋</button></div></div><div class="bank-row"><span class="bank-label">Cuenta:</span><div class="copy-wrapper"><span class="bank-val small-text">${c.numeroCuenta}</span><button class="btn-copy" onclick="copiar('${c.numeroCuenta}')">📋</button></div></div>`; }
            html += `</div>`;
        });
        container.innerHTML = html;
    }

    function configurarCalculadora(tasaDolarReal, tasaEuroReal) {
        const inputDivisa = document.getElementById('calc-divisa');
        const inputBs = document.getElementById('calc-bs');
        const symbolSpan = document.getElementById('symbol-input');
        const switchToggle = document.getElementById('currencySwitch'); 
        const tasaLabel = document.getElementById('tasa-label');

        let tasaActual = tasaDolarReal; 

        const recalcular = (origen) => {
            const val = parseFloat(origen.value || 0);
            if(origen === inputDivisa) {
                inputBs.value = (val * tasaActual).toFixed(2);
            } else {
                inputDivisa.value = (val / tasaActual).toFixed(2);
            }
        };

        if (switchToggle) {
            switchToggle.checked = false; 
            symbolSpan.textContent = '$';

            switchToggle.addEventListener('change', () => {
                const esEuro = switchToggle.checked;
                if (esEuro) {
                    symbolSpan.textContent = '€';
                    tasaActual = tasaEuroReal; 
                } else {
                    symbolSpan.textContent = '$';
                    tasaActual = tasaDolarReal; 
                }
                tasaLabel.textContent = `Tasa oficial: ${tasaActual.toFixed(2)} Bs`;
                recalcular(inputDivisa); 
            });
        }

        if(inputDivisa && inputBs) {
            inputDivisa.oninput = () => recalcular(inputDivisa);
            inputBs.oninput = () => recalcular(inputBs);
        }
        
        tasaLabel.textContent = `Tasa oficial: ${tasaActual.toFixed(2)} Bs`;
        recalcular(inputDivisa);
    }

    window.switchBankTabDash = (index) => { const c = document.querySelector('.bank-data-card'); if(!c) return; const b = c.querySelectorAll('.bank-tab'); b.forEach((btn, i) => i === index ? btn.classList.add('active') : btn.classList.remove('active')); const ct = c.querySelectorAll('.bank-content'); ct.forEach((con, i) => { if(i === index) { con.classList.add('active'); con.style.display = 'block'; } else { con.classList.remove('active'); con.style.display = 'none'; } }); };
    window.copiar = (t) => navigator.clipboard.writeText(t).then(()=>{ mostrarNotificacion("¡Copiado al portapapeles!", "exito"); }).catch(() => { mostrarNotificacion("Error al copiar", "error"); });

    const clockMarks = document.getElementById('clockMarks'); const hourHand = document.getElementById('hourHand'); const minuteHand = document.getElementById('minuteHand'); const secondHand = document.getElementById('secondHand');
    if (clockMarks && hourHand) {
        for (let i = 0; i < 12; i++) { const angle = (i * 30 - 90) * (Math.PI / 180); const x1 = 100 + Math.cos(angle) * 85; const y1 = 100 + Math.sin(angle) * 85; const x2 = 100 + Math.cos(angle) * 90; const y2 = 100 + Math.sin(angle) * 90; const mark = document.createElementNS('http://www.w3.org/2000/svg', 'line'); mark.setAttribute('x1', x1); mark.setAttribute('y1', y1); mark.setAttribute('x2', x2); mark.setAttribute('y2', y2); mark.setAttribute('stroke', 'currentColor'); mark.setAttribute('stroke-width', '2'); mark.setAttribute('opacity', '0.5'); clockMarks.appendChild(mark); }
        function updateClock() { const d = new Date(); const h = d.getHours() % 12; const m = d.getMinutes(); const s = d.getSeconds(); hourHand.setAttribute('x2', 100 + Math.cos((h*30 + m*0.5 - 90)*Math.PI/180) * 40); hourHand.setAttribute('y2', 100 + Math.sin((h*30 + m*0.5 - 90)*Math.PI/180) * 40); minuteHand.setAttribute('x2', 100 + Math.cos((m*6 - 90)*Math.PI/180) * 60); minuteHand.setAttribute('y2', 100 + Math.sin((m*6 - 90)*Math.PI/180) * 60); secondHand.setAttribute('x2', 100 + Math.cos((s*6 - 90)*Math.PI/180) * 70); secondHand.setAttribute('y2', 100 + Math.sin((s*6 - 90)*Math.PI/180) * 70); } setInterval(updateClock, 1000); updateClock();
    }
    const calendarDays = document.getElementById('calendarDays'); const calendarTitle = document.getElementById('calendarTitle'); const prevMonthBtn = document.getElementById('prevMonth'); const nextMonthBtn = document.getElementById('nextMonth');
    if (calendarDays) {
        const now = new Date(); let currentMonth = now.getMonth(); let currentYear = now.getFullYear(); const todayDate = now.getDate(); const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        function renderCalendar(month, year) { calendarDays.innerHTML = ''; if (calendarTitle) calendarTitle.textContent = `${months[month]} ${year}`; const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const daysInPrevMonth = new Date(year, month, 0).getDate(); for (let i = firstDay - 1; i >= 0; i--) { const day = document.createElement('div'); day.className = 'calendar-day prev-month'; day.textContent = daysInPrevMonth - i; calendarDays.appendChild(day); } for (let i = 1; i <= daysInMonth; i++) { const day = document.createElement('div'); day.className = 'calendar-day'; day.textContent = i; if (i === todayDate && month === now.getMonth() && year === now.getFullYear()) day.classList.add('current-day'); calendarDays.appendChild(day); } }
        if(prevMonthBtn) prevMonthBtn.addEventListener('click', () => { currentMonth--; if(currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(currentMonth, currentYear); });
        if(nextMonthBtn) nextMonthBtn.addEventListener('click', () => { currentMonth++; if(currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(currentMonth, currentYear); });
        renderCalendar(currentMonth, currentYear);
    }
    const btnShowQR = document.getElementById('btnShowQR'); const qrModal = document.getElementById('qrModal'); const closeQrModal = document.getElementById('closeQrModal');
    if (btnShowQR && qrModal) { btnShowQR.addEventListener('click', () => qrModal.classList.add('active')); closeQrModal.addEventListener('click', () => qrModal.classList.remove('active')); qrModal.addEventListener('click', (e) => { if(e.target===qrModal) qrModal.classList.remove('active'); }); }
});