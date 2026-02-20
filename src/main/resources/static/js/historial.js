document.addEventListener('DOMContentLoaded', () => {
    // 1. OBTENER USUARIO
    const userId = localStorage.getItem('userId');
    
    // 2. BUSCAR ELEMENTOS EN EL HTML (SELECTORES CORREGIDOS)
    // Buscamos el tbody dentro de la tabla con clase 'history-table'
    const tablaBody = document.querySelector('.history-table tbody'); 
    
    // Tarjetas de Resumen (IDs que agregamos al HTML)
    const totalDisplay = document.getElementById('totalPagadoDisplay');
    const aprobadosDisplay = document.getElementById('conteoAprobados');
    const rechazadosDisplay = document.getElementById('conteoRechazados');

    // Validación de sesión
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // Iniciar carga
    cargarDatosDelHistorial();

    // --- FUNCIÓN PRINCIPAL: CONECTAR AL BACKEND ---
    async function cargarDatosDelHistorial() {
        try {
            // Llamada al servidor
            const respuesta = await fetch(`/api/pagos/historial/${userId}`);
            
            if (!respuesta.ok) throw new Error("Error de red");

            const listaPagos = await respuesta.json(); // Convertir a JSON

            // Pintar datos
            renderizarTabla(listaPagos);
            calcularResumen(listaPagos);

        } catch (error) {
            console.error("Error historial:", error);
            if(tablaBody) tablaBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color: #ef5350;">Error al cargar datos. Intenta recargar.</td></tr>`;
        }
    }

    // --- FUNCIÓN PARA PINTAR LA TABLA ---
    function renderizarTabla(pagos) {
        if (!tablaBody) return; // Seguridad
        tablaBody.innerHTML = ''; // Limpiar tabla

        if (pagos.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem;">No tienes pagos registrados.</td></tr>`;
            return;
        }

        pagos.forEach(pago => {
            const fila = document.createElement('tr');

            // Colores de estado
            let claseSpan = 'status-pendiente'; // Amarillo por defecto (PENDIENTE/EN_REVISION)
            let textoEstado = pago.estatus;

            if (pago.estatus === 'APROBADO') {
                claseSpan = 'status-solvente'; // Verde
            } else if (pago.estatus === 'RECHAZADO') {
                claseSpan = 'status-moroso'; // Rojo
            }

            // Formato de Moneda (Bs)
            const montoFormateado = parseFloat(pago.monto).toLocaleString('es-VE', { minimumFractionDigits: 2 });
            
            // Fecha
            const fechaStr = pago.fecha ? pago.fecha : '--';

            // HTML de la fila
            fila.innerHTML = `
                <td>${pago.concepto || 'Desconocido'}</td>
                <td>${montoFormateado}</td>
                <td>Bs.S</td>
                <td>${fechaStr}</td>
                <td><span class="status-tag ${claseSpan}">${textoEstado}</span></td>
            `;

            tablaBody.appendChild(fila);
        });
    }

    // --- FUNCIÓN PARA LOS CUADRITOS DE RESUMEN ---
    function calcularResumen(pagos) {
        let total = 0;
        let aprobados = 0;
        let rechazados = 0;

        pagos.forEach(p => {
            if (p.estatus === 'APROBADO') {
                total += parseFloat(p.monto);
                aprobados++;
            } else if (p.estatus === 'RECHAZADO') {
                rechazados++;
            }
        });

        // Actualizar HTML si los elementos existen
        if(totalDisplay) totalDisplay.textContent = `Bs. ${total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
        if(aprobadosDisplay) aprobadosDisplay.textContent = aprobados;
        if(rechazadosDisplay) rechazadosDisplay.textContent = rechazados;
    }
});