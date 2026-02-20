document.addEventListener('DOMContentLoaded', () => {
  
  const tableBody = document.getElementById('studentsTableBody');
  const searchInput = document.getElementById('searchStudent');
  const modal = document.getElementById('studentModal');
  const form = document.getElementById('student-form');
  const modalTitle = document.querySelector('.modal-title');
  const totalCounter = document.querySelector('.top-header .badge');
  let studentsData = []; 

  // INICIALIZACIÓN
  cargarSelectoresDinamicos(); // <--- ESTO ES LO NUEVO
  cargarEstudiantes();

  
  // --- 0. CARGAR SELECTORES DESDE BD ---
  async function cargarSelectoresDinamicos() {
      try {
          // 1. Cargar Carreras
          const resCarreras = await fetch('/api/usuarios/recursos/carreras');
          if(resCarreras.ok) {
              const carreras = await resCarreras.json();
              const select = document.getElementById('carrera');
              select.innerHTML = '';
              // Usamos el NOMBRE como valor porque tu backend espera el nombre en "carrera"
              carreras.forEach(c => {
                  select.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
              });
          }

          // 2. Cargar Extensiones
          const resExt = await fetch('/api/usuarios/recursos/extensiones');
          if(resExt.ok) {
              const extensiones = await resExt.json();
              const select = document.getElementById('extension');
              select.innerHTML = '';
              // Usamos el ID como valor porque tu backend espera "extensionId"
              extensiones.forEach(e => {
                  select.innerHTML += `<option value="${e.id}">${e.nombre}</option>`;
              });
          }
      } catch(e) { console.error("Error cargando listas:", e); }
  }

  // --- 1. CARGAR ESTUDIANTES ---
  async function cargarEstudiantes() {
    try {
      const res = await fetch('/api/usuarios/estudiantes'); 
      if(res.ok) {
        studentsData = await res.json();
        if(totalCounter) totalCounter.textContent = `Total: ${studentsData.length}`;
        renderTable(studentsData);
      }
    } catch(e) { console.error("Error cargando estudiantes:", e); }
  }

  // --- 2. RENDERIZAR TABLA ---
  function renderTable(lista) {
    tableBody.innerHTML = '';
    
    if(lista.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#888;">No hay estudiantes registrados.</td></tr>`;
        return;
    }

    lista.forEach(s => {
      let avatarHtml;
      const isInscrito = s.estatus === 'INSCRITO';
      const statusText = isInscrito ? 'Inscrito' : 'Pendiente';
      const statusColor = isInscrito ? '#4CAF50' : '#FFC107'; 
      const avatarColor = isInscrito ? '#e8f5e9' : '#fff3e0'; 

      if (s.fotoPerfil) {
          avatarHtml = `<img src="${s.fotoPerfil}" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">`;
      } else {
          avatarHtml = `<div class="user-avatar-placeholder" style="background:${avatarColor}; color:${statusColor}; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:bold; width:35px; height:35px; border-radius:50%;">
                ${s.nombre.charAt(0)}${s.apellido ? s.apellido.charAt(0) : ''}
              </div>`;
      }

      // Botón Toggle
      const isActive = s.activo !== false; 
      const toggleLabel = isActive ? 'Desactivar' : 'Activar';
      const toggleClass = isActive ? 'danger' : 'success'; 
      const rowStyle = isActive ? '' : 'opacity: 0.6; background-color: rgba(0,0,0,0.02);';

      const row = `
        <tr style="${rowStyle}">
          <td>
            <div class="user-cell">
            ${avatarHtml}
              <div>
                <div class="user-name">${s.nombre} ${s.apellido || ''}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${s.email}</div>
              </div>
            </div>
          </td>
          <td>${s.cedula || 'N/A'}</td>
          <td>${s.carrera || 'Sin asignar'}</td>
          <td>
            <div class="status-indicator">
              <span class="status-dot" style="background-color: ${statusColor};"></span> 
              <span style="font-weight:500; font-size:0.9rem; color:${statusColor}">${statusText}</span>
            </div>
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn-sm edit" onclick="openEdit(${s.id})">Editar</button>
              <button class="btn-sm ${toggleClass}" onclick="toggleStudent(${s.id})">${toggleLabel}</button>
            </div>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }

  // --- 3. BUSCADOR ---
  if(searchInput) {
      searchInput.addEventListener('input', (e) => {
          const term = e.target.value.toLowerCase();
          const filtrados = studentsData.filter(s => 
              (s.nombre && s.nombre.toLowerCase().includes(term)) ||
              (s.cedula && s.cedula.includes(term)) ||
              (s.carrera && s.carrera.toLowerCase().includes(term))
          );
          renderTable(filtrados);
      });
  }

  // --- 4. MODALES ---
  document.getElementById('btnAddStudent').addEventListener('click', () => {
      form.reset();
      document.getElementById('edit-id').value = ''; 
      modalTitle.textContent = "Inscribir Nuevo Estudiante";
      modal.classList.add('active');
  });

  // ABRIR EDITAR (LÓGICA MEJORADA)
  window.openEdit = async (id) => {
      try {
          const res = await fetch(`/api/usuarios/perfil/${id}`);
          if (res.ok) {
              const s = await res.json();
              document.getElementById('edit-id').value = s.id;
              document.getElementById('nombre').value = s.nombre;
              document.getElementById('apellido').value = s.apellido;
              document.getElementById('cedula').value = s.cedula;
              document.getElementById('email').value = s.email;
              
              // SELECCIÓN AUTOMÁTICA DE CARRERA
              // Como el value del option es el nombre real, esto debería funcionar directo
              const carreraSelect = document.getElementById('carrera');
              if (s.carrera) {
                  carreraSelect.value = s.carrera; 
              }

              // SELECCIÓN AUTOMÁTICA DE EXTENSIÓN
              // El backend nos manda "extensionId", y el option value es el ID
              const extensionSelect = document.getElementById('extension');
              if(s.extensionId) {
                  extensionSelect.value = s.extensionId;
              }
              
              document.getElementById('password').value = ''; 
              modalTitle.textContent = "Editar Estudiante";
              modal.classList.add('active');
          }
      } catch (e) {
          console.error("Error al cargar perfil:", e);
          mostrarNotificacion("Error al cargar perfil del estudiante", "error");
      }
  };

  window.toggleStudent = async (id) => {
      if(!confirm('¿Deseas cambiar el estado (Activo/Inactivo) de este estudiante?')) return;
      try {
          const res = await fetch(`/api/usuarios/estudiantes/${id}/toggle`, { method: 'PUT' });
          if(res.ok) cargarEstudiantes(); 
          else mostrarNotificacion("No se pudo cambiar el estado del estudiante", "error");
      } catch(e) { console.error(e); }
  };

  // --- 5. GUARDAR ---
  form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('edit-id').value;
      const isEdit = id ? true : false;
      const endpoint = isEdit ? `/api/usuarios/estudiantes/${id}` : `/api/usuarios/registrar`;
      const method = isEdit ? 'PUT' : 'POST';

      // Obtenemos el ID de extensión y el Nombre de carrera directamente de los selects
      const extensionId = document.getElementById('extension').value;
      const carreraNombre = document.getElementById('carrera').value;

      const payload = {
          nombre: document.getElementById('nombre').value,
          apellido: document.getElementById('apellido').value,
          cedula: document.getElementById('cedula').value,
          email: document.getElementById('email').value,
          carrera: carreraNombre, 
          rol: 'ESTUDIANTE',
          extensionId: extensionId 
      };

      const pass = document.getElementById('password').value;
      if(pass) payload.password = pass;
      else if(!isEdit) { mostrarNotificacion("La contraseña es obligatoria para nuevos estudiantes", "error"); return; }

      try {
          const res = await fetch(endpoint, {
              method: method,
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload)
          });

          if(res.ok) {
              mostrarNotificacion(isEdit ? "Estudiante actualizado" : "Estudiante inscrito", "exito");
              modal.classList.remove('active');
              cargarEstudiantes(); 
          } else {
              const err = await res.json();
              mostrarNotificacion(err.error || "Error al guardar", "error");
          }
      } catch(error) { console.error(error); mostrarNotificacion("Error de conexión", "error"); }
  });

  document.getElementById('closeStudentModal').addEventListener('click', () => modal.classList.remove('active'));
});