document.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    let datosGlobales = {
        totalEstudiantes: 0,
        morosos: 0,
        porcentajeGlobal: 0,
        grafico: []
    };
    let tasasCache = { USD: 0, EUR: 0 };
    let monedaActual = 'USD';

    //  Cargar Dashboard
    cargarDashboardDueño();

    async function cargarDashboardDueño() {
        try {
            const res = await fetch('/api/dueno/dashboard-kpi');
            if (!res.ok) throw new Error("Error API");
            const data = await res.json();

            // Guardar datos globales
            datosGlobales.totalEstudiantes = data.totalEstudiantes;
            datosGlobales.morosos = data.morosos; 
            datosGlobales.porcentajeGlobal = data.porcentajeSolvencia;
            datosGlobales.grafico = data.datosGrafico;

            // Renderizar Estado Inicial
            actualizarTarjetaEstudiantes(datosGlobales.totalEstudiantes, datosGlobales.morosos, "General");
            actualizarAnillo(datosGlobales.porcentajeGlobal, "Solvencia Global");
            
            // KPIs
            const kpiIngreso = document.querySelector('.kpi-value');
            if(kpiIngreso) kpiIngreso.textContent = `Bs ${data.ingresos.toLocaleString('es-VE', {minimumFractionDigits: 2})}`;
            
            tasasCache.USD = data.tasaUsd;
            tasasCache.EUR = data.tasaEur;
            renderizarTasa();
            renderizarAuditoria(data.auditoria);

            // GRÁFICO
            renderizarGrafico(data.datosGrafico);

        } catch (error) { 
            console.error("Error dashboard:", error);
            const container = document.querySelector('.chart-bars-container');
            if(container) container.innerHTML = '<p style="color:red; margin:auto;">Error de conexión</p>';
        }
    }

    // --- RENDERIZADORES ---

    function renderizarGrafico(datos) {
        const container = document.querySelector('.chart-bars-container');
        if (!container) return;
        
        container.innerHTML = ''; 

        if (!datos || datos.length === 0) {
            container.innerHTML = '<p style="margin:auto; color:gray;">Sin periodo activo o datos.</p>';
            return;
        }

        let maxTotal = 0;
        datos.forEach(d => { if (d.total > maxTotal) maxTotal = d.total; });
        if (maxTotal === 0) maxTotal = 1; 

        datos.forEach((d, index) => {
            const heightBg = (d.total / maxTotal) * 100;
            let percentFill = (d.total > 0) ? (d.pagados / d.total) * 100 : 0;
            
            // Verde si >= 100%, Azul si no
            const color = (percentFill >= 100) ? '#4CAF50' : '#3f51b5';

            const html = `
                <div class="chart-bar-group" onclick="window.seleccionarBarra(${index})">
                    <span class="chart-value">${d.pagados}/${d.total}</span>
                    <div class="chart-bar-bg" style="height: ${heightBg}%;">
                        <div class="chart-bar-fill" style="height: ${percentFill}%; background-color: ${color};"></div>
                    </div>
                    <span class="chart-label" title="${d.label}">${d.label}</span>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
    }

    // --- INTERACCIÓN ---
    window.seleccionarBarra = (index) => {
        const dato = datosGlobales.grafico[index];
        if(!dato) return;

        // Actualizar Anillo
        actualizarAnillo(dato.porcentaje, "Solvencia " + dato.label);

        // Actualizar Tarjeta
        const pendientes = dato.total - dato.pagados;
        actualizarTarjetaEstudiantes(dato.total, pendientes, "Concepto: " + dato.label);
    };

    function actualizarAnillo(porcentaje, texto) {
        const circle = document.querySelector('.circular-chart .circle');
        const text = document.querySelector('.percentage');
        const label = document.querySelector('.admin-donut-chart p');

        if(circle && text) {
            let color = '#4cc9f0'; // Azul default
            if(porcentaje < 50) color = '#ff5252'; // Rojo
            else if(porcentaje < 80) color = '#f72585'; // Rosa

            circle.style.stroke = color;
            circle.setAttribute('stroke-dasharray', `${porcentaje}, 100`);
            text.textContent = `${porcentaje}%`;
            if(label) label.textContent = texto;
        }
    }

    function actualizarTarjetaEstudiantes(total, pendientes, subtitulo) {
        const cards = document.querySelectorAll('.card-kpi');
        if(cards.length < 2) return;
        
        const cardEst = cards[1]; // La segunda tarjeta es "Total Estudiantes"
        const val = cardEst.querySelector('.kpi-value');
        const sub = cardEst.querySelector('.kpi-sub');

        if (val) val.textContent = total;
        
        if (sub) {
            if(pendientes > 0) {
                sub.textContent = `${pendientes} pendientes (${subtitulo})`;
                sub.style.color = '#ff5252'; 
            } else {
                sub.textContent = "¡Todos al día!";
                sub.style.color = '#4caf50'; 
            }
        }
    }

    function renderizarTasa() {
        const cards = document.querySelectorAll('.card-kpi');
        if(cards.length < 3) return;
        const cardTasa = cards[2]; // La tercera tarjeta es Tasa
        
        const val = cardTasa.querySelector('.kpi-value');
        if (val) {
            const valor = tasasCache[monedaActual] || 0;
            val.textContent = `${valor.toFixed(2)} Bs`;
        }
    }

    function renderizarAuditoria(lista) {
        const container = document.querySelector('.activity-list');
        if (!container) return;
        container.innerHTML = '';

        if (!lista || lista.length === 0) {
            container.innerHTML = '<p style="padding:1rem; color:#888; text-align:center;">Sin actividad reciente.</p>';
            return;
        }

        lista.forEach(log => {
            let tiempo = "Reciente";
            if (log.fecha) {
                const fechaLog = new Date(log.fecha);
                const ahora = new Date();
                const diffMin = Math.floor((ahora - fechaLog) / 60000);
                if (diffMin < 1) tiempo = "Hace instantes";
                else if (diffMin < 60) tiempo = `Hace ${diffMin} min`;
                else if (diffMin < 1440) tiempo = `Hace ${Math.floor(diffMin / 60)}h`;
                else tiempo = fechaLog.toLocaleDateString();
            }

            let icono = '👤';
            let claseIcono = 'user'; 
            const accionLower = (log.accion || '').toLowerCase();
            
            if (accionLower.includes('pago') || accionLower.includes('aprobó')) {
                icono = '$'; claseIcono = 'payment';
            } else if (accionLower.includes('rechazó') || accionLower.includes('error')) {
                icono = '⚠️'; claseIcono = 'alert';
            } else if (accionLower.includes('sistema') || accionLower.includes('tasa')) {
                icono = '⚙️'; claseIcono = 'system';
            }

            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon ${claseIcono}">${icono}</div>
                <div class="activity-info">
                    <strong>${log.accion}</strong>
                    <p>${log.usuario || 'Sistema'} <span style="opacity:0.7">(${log.rol || 'Auto'})</span></p>
                    <span class="time">${tiempo}</span>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // --- EVENTOS DE BOTONES ---
    window.switchCurrency = (moneda) => {
        monedaActual = moneda;
        const btnUsd = document.getElementById('btnSwitchUsd');
        const btnEur = document.getElementById('btnSwitchEur');
        
        if(btnUsd && btnEur) {
            if (moneda === 'USD') {
                btnUsd.classList.add('active');
                btnEur.classList.remove('active');
            } else {
                btnEur.classList.add('active');
                btnUsd.classList.remove('active');
            }
        }
        renderizarTasa();
    };

    const btnUpdate = document.getElementById('btnUpdateTasa');
    if (btnUpdate) {
        btnUpdate.addEventListener('click', async () => {
            btnUpdate.disabled = true;
            btnUpdate.innerHTML = '...';
            try {
                await fetch('/api/config/tasas/forzar-bcv', { method: 'POST' });
                await cargarDashboardDueño(); 
            } catch(e) { mostrarNotificacion("No se pudo actualizar la tasa", "error"); }
            btnUpdate.disabled = false;
            btnUpdate.innerHTML = 'Actualizar';
        });
    }

    // Listener para cuando seleccionan el archivo
document.getElementById('excelInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Feedback visual inmediato
    mostrarNotificacion("Subiendo archivo...", "exito"); // Usa tu función de notif

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/importacion/estudiantes', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            
            // Mensaje inteligente
            if (data.guardados > 0) {
                mostrarNotificacion(`¡Éxito! Se registraron ${data.guardados} estudiantes.`, "exito");
                // Recargar la tabla automáticamente
                setTimeout(() => location.reload(), 2000);
            } else {
                mostrarNotificacion("No se registraron estudiantes (¿Ya existían?)", "warning");
            }

            // Si hubo errores en algunas filas, mostrarlos en consola
            if (data.errores.length > 0) {
                console.warn("Errores de importación:", data.errores);
                alert("Atención: Algunos estudiantes no se cargaron. Revisa la consola (F12) para ver detalles.");
            }

        } else {
            mostrarNotificacion("Error al procesar el archivo Excel", "error");
        }

    } catch (error) {
        console.error(error);
        mostrarNotificacion("Error de conexión", "error");
    } finally {
        // Limpiar el input para permitir subir el mismo archivo si falló
        e.target.value = '';
    }
});
});