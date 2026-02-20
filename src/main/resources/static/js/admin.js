/* ======================================== */
/* SCRIPT DASHBOARD ADMINISTRADOR (admin.js) */
/* ======================================== */

// VARIABLES GLOBALES
let datosGlobales = {
    totalEstudiantes: 0,
    morosos: 0,
    grafico: []
};

document.addEventListener('DOMContentLoaded', () => {

    // 1. Cargar Perfil
    const userId = localStorage.getItem('userId');
    if (userId) {
        fetch(`/api/estudiante/dashboard/${userId}`)
            .then(res => res.json())
            .then(data => {
                const title = document.querySelector('.welcome-title');
                const subtitle = document.querySelector('.welcome-subtitle');
                if(title) title.textContent = `¡Bienvenido de vuelta, ${data.nombre}!`;
                if(subtitle) subtitle.textContent = `Panel de Control - ${data.rol}`;
            })
            .catch(console.error);
    }

    // 2. Cargar Estadísticas
    cargarEstadisticas();
});

async function cargarEstadisticas() {
    try {
        const res = await fetch('/api/admin/dashboard-stats');
        if(!res.ok) throw new Error("Error API");
        const data = await res.json();

        // GUARDAR DATOS GLOBALES
        datosGlobales.totalEstudiantes = data.totalEstudiantes;
        datosGlobales.morosos = data.estudiantesMorosos;
        datosGlobales.grafico = data.datosGrafico;

        // A. TARJETA PAGOS PENDIENTES
        const pagosDisplay = document.getElementById('pagosRevisarDisplay');
        if(pagosDisplay) pagosDisplay.textContent = data.pagosPorRevisar;

        // B. TARJETA CENTRAL (ESTUDIANTES)
        actualizarTarjetaCentral(datosGlobales.totalEstudiantes, datosGlobales.morosos, "");

        // C. TARJETA INGRESOS
        const dineroDisplay = document.getElementById('totalRecaudadoDisplay');
        if(dineroDisplay) {
            const monto = data.totalRecaudado || 0;
            dineroDisplay.textContent = `Bs ${monto.toLocaleString('es-VE', {minimumFractionDigits: 2})}`;
        }

        // D. GRÁFICO
        renderizarGrafico(data.datosGrafico);

    } catch (error) {
        console.error("Error stats:", error);
    }
}

// --- RENDERIZADOR DEL GRÁFICO (CON ANIMACIÓN) ---
function renderizarGrafico(datos) {
    const container = document.querySelector('.chart-bars-container');
    if (!container) return;
    container.innerHTML = ''; 

    if (!datos || datos.length === 0) {
        container.innerHTML = '<p style="margin:auto; color:gray;">Sin periodo activo.</p>';
        return;
    }

    let maxTotal = 0;
    datos.forEach(d => { if (d.total > maxTotal) maxTotal = d.total; });
    if (maxTotal === 0) maxTotal = 1; 

    datos.forEach((d, index) => {
        const heightBg = (d.total / maxTotal) * 100;
        let percentFill = (d.total > 0) ? (d.pagados / d.total) * 100 : 0;
        const color = (percentFill >= 100) ? '#4CAF50' : '#3f51b5';

        const html = `
            <div class="chart-bar-group" onclick="window.seleccionarBarraAdmin(${index})">
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

// --- FUNCIONES GLOBALES (INTERACCIÓN) ---

window.seleccionarBarraAdmin = (index) => {
    const dato = datosGlobales.grafico[index];
    if(!dato) return;

    // Calculamos pendientes de ESA cuota
    const pendientes = dato.total - dato.pagados;
    
    // Actualizamos la tarjeta central
    actualizarTarjetaCentral(dato.total, pendientes, `(${dato.label})`);
};

// --- ACTUALIZAR TARJETA CENTRAL (ESTUDIANTES) ---
function actualizarTarjetaCentral(total, pendientes, subtitulo) {
    const totalEstDisplay = document.getElementById('totalEstudiantesDisplay');
    const morososWrapper = document.getElementById('morososWrapper'); // El <p> completo
    
    // 1. Actualizar el número grande (Total de inscritos en esa cuota)
    if(totalEstDisplay) {
        // Animación simple de conteo (opcional, pero se ve bien)
        totalEstDisplay.textContent = total; 
    }
    
    // 2. Actualizar el texto de abajo (Pendientes y Concepto)
    if(morososWrapper) {
        if(pendientes > 0) {
            morososWrapper.style.color = '#FF5252'; // Rojo
            // Usamos innerHTML para poner negrita en el número
            // El 'subtitulo' trae el nombre del concepto (ej: "(Mensualidad 1)")
            morososWrapper.innerHTML = `⚠️ <b>${pendientes}</b> con deuda vencida <br><span style="font-size:0.8em; color:#666;">${subtitulo}</span>`;
        } else {
            morososWrapper.style.color = '#4CAF50'; // Verde
            morososWrapper.innerHTML = `✅ ¡Todos solventes! <br><span style="font-size:0.8em; color:#666;">${subtitulo}</span>`;
        }
    }
}