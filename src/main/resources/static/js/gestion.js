document.addEventListener('DOMContentLoaded', () => {

    let estudiantesGlobal = []; // Para el buscador

    // Inicializar
    cargarSelectoresDinamicos();
    cargarEstudiantes();

    // --- VALIDACIÓN DE CÉDULA (SOLO NÚMEROS) ---
    const inputCedula = document.getElementById('cedula');
    if (inputCedula) {
        inputCedula.addEventListener('input', function() {
            // Reemplaza cualquier cosa que NO sea un número (0-9) por vacío
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    
    // --- BUSCADOR ---
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = estudiantesGlobal.filter(est => 
                (est.nombre && est.nombre.toLowerCase().includes(term)) ||
                (est.apellido && est.apellido.toLowerCase().includes(term)) ||
                (est.cedula && est.cedula.includes(term))
            );
            renderizarLista(filtrados);
        });
    }

    // --- 1. CARGAR LISTAS ---
    async function cargarSelectoresDinamicos() {
        try {
            const resCarreras = await fetch('/api/usuarios/recursos/carreras');
            if(resCarreras.ok) {
                const carreras = await resCarreras.json();
                const select = document.getElementById('carrera');
                select.innerHTML = '';
                carreras.forEach(c => select.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`);
            }

            const resExt = await fetch('/api/usuarios/recursos/extensiones');
            if(resExt.ok) {
                const extensiones = await resExt.json();
                const select = document.getElementById('extension');
                select.innerHTML = '';
                extensiones.forEach(e => select.innerHTML += `<option value="${e.id}">${e.nombre}</option>`);
            }
        } catch(e) { console.error("Error listas:", e); }
    }

    // --- 2. CARGAR ESTUDIANTES ---
    async function cargarEstudiantes() {
        try {
            const respuesta = await fetch('/api/usuarios/estudiantes');
            estudiantesGlobal = await respuesta.json(); // Guardamos en global para el buscador
            renderizarLista(estudiantesGlobal);
        } catch (error) { console.error(error); }
    }

    function renderizarLista(lista) {
        const listaContainer = document.querySelector('.student-list');
        if (!listaContainer) return;

        listaContainer.innerHTML = '';

        if(lista.length === 0) {
            listaContainer.innerHTML = '<p style="text-align:center; padding:1rem; color:#888;">No hay resultados.</p>';
            return;
        }

        lista.forEach(est => {
            const jsonEst = encodeURIComponent(JSON.stringify(est));
            
            // Lógica Activo/Inactivo
            const isActivo = (est.activo === true || est.activo === null); 
            // Si está inactivo, bajamos opacidad y ponemos filtro gris
            const estiloFila = isActivo ? '' : 'opacity: 0.6; filter: grayscale(100%); background: #f5f5f5;';
            
            const iconLock = isActivo ? 
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>` : 
                `<svg viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;

            // Lógica Foto
            let avatarHTML;
            if (est.fotoPerfil) {
                const ruta = est.fotoPerfil.startsWith('/') ? est.fotoPerfil : `/${est.fotoPerfil}`;
                avatarHTML = `<img src="${ruta}" class="student-avatar-img">`;
            } else {
                avatarHTML = `<div class="student-avatar-placeholder">${est.nombre.charAt(0)}</div>`;
            }

            const html = `
              <div class="list-item" style="${estiloFila} transition: all 0.3s;">
                
                <div class="item-left">
                    ${avatarHTML}
                    <div class="item-info">
                      <span class="item-name">${est.nombre} ${est.apellido || ''}</span>
                      <span class="item-detail">C.I: ${est.cedula}</span>
                      <span class="item-sub-detail">${est.extension || ''}</span>
                    </div>
                </div>

                <div class="item-actions">
                  <button class="btn-icon btn-edit" title="Editar" onclick="prepararEdicion('${jsonEst}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-icon btn-delete" title="${isActivo ? 'Desactivar' : 'Activar'}" onclick="toggleEstudiante(${est.id}, ${isActivo})">
                    ${iconLock}
                  </button>
                </div>
              </div>
            `;
            listaContainer.innerHTML += html;
        });
    }

    // --- 3. FORMULARIO (Crear/Editar) ---
    const formRegistro = document.getElementById('registro-estudiante-form');

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formRegistro.querySelector('.btn-submit-feedback');
            btnSubmit.innerText = "Procesando..."; btnSubmit.disabled = true;

            const editId = document.getElementById('edit-id').value;
            const esEdicion = !!editId;

            const payload = {
                nombre: document.getElementById('nombre').value,
                apellido: document.getElementById('apellido').value,
                cedula: document.getElementById('cedula').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                carrera: document.getElementById('carrera').value,
                extensionId: document.getElementById('extension').value
            };

            const url = esEdicion ? `/api/usuarios/estudiantes/${editId}` : '/api/usuarios/registrar';
            const method = esEdicion ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    mostrarNotificacion(esEdicion ? "¡Datos actualizados!" : "¡Estudiante registrado!", "exito");
                    resetearFormulario();
                    cargarEstudiantes(); 
                } else {
                    const err = await res.json();
                    mostrarNotificacion("Error: " + (err.error || "Operación fallida"), "error");
                }
            } catch (error) { mostrarNotificacion("Error de conexión", "error"); } 
            finally {
                if(document.getElementById('edit-id').value) btnSubmit.innerText = "Guardar Cambios";
                else btnSubmit.innerText = "Registrar Estudiante";
                btnSubmit.disabled = false;
            }
        });
    }

    // --- FUNCIONES GLOBALES ---
    
    window.prepararEdicion = (jsonEst) => {
        const est = JSON.parse(decodeURIComponent(jsonEst));
        
        document.getElementById('edit-id').value = est.id;
        document.getElementById('nombre').value = est.nombre;
        document.getElementById('apellido').value = est.apellido || '';
        document.getElementById('cedula').value = est.cedula;
        document.getElementById('email').value = est.email;
        document.getElementById('carrera').value = est.carrera;
        
        // AQUÍ ESTABA EL ERROR DE LA EXTENSIÓN
        // Ahora usamos 'extensionId' que viene del backend, así el select sabe cuál marcar
        if(est.extensionId) {
            document.getElementById('extension').value = est.extensionId;
        }
        
        document.getElementById('password').value = ""; 
        document.getElementById('password').placeholder = "(Dejar en blanco para mantener)";
        document.getElementById('password').required = false; 

        const btn = document.querySelector('.btn-submit-feedback');
        btn.innerText = "Guardar Cambios";
        btn.style.background = "linear-gradient(135deg, #FFB300, #F57F17)";
        
        document.querySelector('.form-section-title').innerText = "Editar Estudiante: " + est.nombre;
        document.querySelector('.card-form').scrollIntoView({behavior: 'smooth'});
    };

    window.resetearFormulario = () => {
        document.getElementById('registro-estudiante-form').reset();
        document.getElementById('edit-id').value = "";
        
        const btn = document.querySelector('.btn-submit-feedback');
        btn.innerText = "Registrar Estudiante";
        btn.style.background = ""; 
        
        document.querySelector('.form-section-title').innerText = "Registrar Nuevo Estudiante";
        document.getElementById('password').required = true;
        document.getElementById('password').placeholder = "";
    }

    window.toggleEstudiante = async (id, estadoActual) => {
        // Confirmación visual
        const accion = estadoActual ? "desactivar" : "activar";
        if(!confirm(`¿Seguro que deseas ${accion} a este estudiante?`)) return;

        try {
            const res = await fetch(`/api/usuarios/estudiantes/${id}/toggle`, { method: 'PUT' });
            if(res.ok) {
                cargarEstudiantes(); // Recargar para ver el cambio visual
            } else {
                mostrarNotificacion("No se pudo cambiar el estado del estudiante", "error");
            }
        } catch(e) { console.error(e); }
    };
});