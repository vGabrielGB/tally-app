document.addEventListener('DOMContentLoaded', () => {
  
  // Elementos DOM
  const resultCard = document.getElementById('resultCard');
  const waitingCard = document.getElementById('waitingCard');
  const manualInput = document.getElementById('manualInput');
  const btnManualCheck = document.getElementById('btnManualCheck');
  const historyList = document.getElementById('historyList');

  // Elementos Resultado
  const studentName = document.getElementById('studentName');
  const studentId = document.getElementById('studentId');
  const statusBadge = document.getElementById('statusBadge');
  const lastPaymentDate = document.getElementById('lastPaymentDate');
  const resultIconBox = document.getElementById('resultIconBox');
  const scanTime = document.getElementById('scanTime');

  let html5QrcodeScanner = null;

  // --- FUNCIÓN: AGREGAR A HISTORIAL ---
  function addToHistory(name, id, status) {
    const emptyMsg = document.querySelector('.history-empty');
    if(emptyMsg) emptyMsg.remove();

    let statusClass = 'h-error';
    let statusText = 'X';

    if (status === 'AUTORIZADO') {
        statusClass = 'h-success'; statusText = 'OK';
    } else if (status === 'PENDIENTE') {
        statusClass = 'h-warning'; statusText = '⚠️'; // Amarillo para historial
    }

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div>
        <span class="h-name">${name}</span>
        <span class="h-id">${id}</span>
      </div>
      <div class="h-status ${statusClass}">${statusText}</div>
    `;
    
    historyList.prepend(item);
    if(historyList.children.length > 5) historyList.lastElementChild.remove();
  }

  // --- PROCESAR CON API REAL ---
  const resultPhoto = document.getElementById('resultPhoto');

  async function procesarVerificacion(codigo) {
    if(html5QrcodeScanner) try { html5QrcodeScanner.pause(); } catch(e){}
    waitingCard.style.display = 'none';
    resultCard.style.display = 'block';
    
    // Reset visual previo
    resultPhoto.style.display = 'none';
    resultIconBox.style.display = 'flex';
    resultCard.className = 'result-card'; // Limpiar colores viejos

    try {
        const res = await fetch(`/api/acceso/verificar/${encodeURIComponent(codigo)}`);
        if (!res.ok) throw new Error("Error de red");
        
        const data = await res.json();

        // Llenar textos
        studentName.textContent = data.nombre;
        studentId.textContent = data.cedula;
        lastPaymentDate.textContent = data.mensaje || "--";

        // --- LÓGICA DE FOTO ---
        if (data.fotoPerfil) {
            resultPhoto.src = data.fotoPerfil;
            resultPhoto.style.display = 'block'; 
            resultIconBox.style.display = 'none'; 
        } else {
            resultPhoto.style.display = 'none';
            resultIconBox.style.display = 'flex';
        }

        // Asignar colores y estado
        if (data.estado === 'AUTORIZADO') {
            resultCard.classList.add('status-success');
            statusBadge.textContent = 'AUTORIZADO';
            resultIconBox.innerHTML = `✔`; // Solo visible si no hay foto
            addToHistory(data.nombre, data.cedula, 'AUTORIZADO');
        } 
        else if (data.estado === 'DENEGADO') {
            resultCard.classList.add('status-error');
            statusBadge.textContent = 'DENEGADO';
            resultIconBox.innerHTML = '✖';
            addToHistory(data.nombre, data.cedula, 'DENEGADO');
        } 
        else {
            // Pendiente o No registrado
            resultCard.classList.add('status-warning');
            statusBadge.textContent = data.estado;
            resultIconBox.innerHTML = '⚠️';
            addToHistory(data.nombre, data.cedula, data.estado);
        }

    } catch (error) {
        console.error(error);
        // Manejo de error
        resultCard.classList.add('status-warning');
        studentName.textContent = "Error de Conexión";
        statusBadge.textContent = "OFFLINE";
    }
  }

  // --- MANUAL ---
  if(btnManualCheck) {
    btnManualCheck.addEventListener('click', () => {
      let val = manualInput.value.trim().toUpperCase();
      if(val.length >= 1) procesarVerificacion(val);
      else mostrarNotificacion("Por favor ingrese una cédula válida", "error");
    });
    manualInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnManualCheck.click(); });
  }

  // --- RESET ---
  window.resetScanner = () => {
    resultCard.style.display = 'none';
    waitingCard.style.display = 'block';
    manualInput.value = '';
    manualInput.focus();
    if(html5QrcodeScanner) try { html5QrcodeScanner.resume(); } catch(e){}
  };

  // --- QR INIT ---
  function onScanSuccess(decodedText) { procesarVerificacion(decodedText); }
  
  if(document.getElementById('reader')) {
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    html5QrcodeScanner.render(onScanSuccess);
  }
});