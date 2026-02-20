document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('staffTableBody');
    const searchInput = document.getElementById('searchStaff');
    let personalData = []; 

    cargarPersonal();

    async function cargarPersonal() {
        try {
            const res = await fetch('/api/usuarios/personal');
            if(res.ok) {
                personalData = await res.json();
                renderizarTabla(personalData);
            }
        } catch(e) { console.error("Error cargando personal:", e); }
    }

    function renderizarTabla(lista) {
        tableBody.innerHTML = '';
        
        if(lista.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#888;">No hay empleados registrados.</td></tr>`;
            return;
        }

        lista.forEach(p => {

            let avatarHtml;
        
            // 1. Lógica del Rol
            const rolStr = p.rol ? p.rol.toUpperCase() : 'N/A';
            const roleClass = (rolStr === 'ADMIN' || rolStr === 'ADMINISTRADOR') ? 'badge-admin' : 'badge-verificador';
            
            // 2. Lógica del Estado (Activo/Inactivo)
            // Si el backend devuelve null en activo, asumimos true (legacy)
            const isActivo = (p.activo === null || p.activo === true); 
            
            const statusClass = isActivo ? 'status-active' : 'status-inactive'; // Necesitaremos CSS para inactive
            const statusText = isActivo ? 'Activo' : 'Inactivo';
            const statusDotColor = isActivo ? '#4CAF50' : '#d3622e'; // Verde o Gris

            if (p.fotoPerfil) {
            avatarHtml = `<img src="${p.fotoPerfil}" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">`;
        } else {
            const inicial = p.nombre ? p.nombre.charAt(0).toUpperCase() : '?';
            avatarHtml = `<div class="user-avatar-placeholder" style="background:${statusClass}; color:${statusDotColor}; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:bold; width:35px; height:35px; border-radius:50%;">
                ${p.nombre.charAt(0)}${p.apellido ? p.apellido.charAt(0) : ''}
              </div>`;
        }

            // 3. Lógica del Botón (Desactivar/Activar)
            // Si está activo -> Botón Naranja "Desactivar"
            // Si está inactivo -> Botón Verde "Activar"
            const btnActionText = isActivo ? 'Desactivar' : 'Activar';
            const btnActionClass = isActivo ? 'btn-sm warning' : 'btn-sm success'; 
            const btnIcon = isActivo ? '🔒' : '🔓';

            const inicial = p.nombre ? p.nombre.charAt(0).toUpperCase() : '?';

            const row = `
                <tr style="${!isActivo ? 'opacity: 0.6;' : ''}"> <td>
                        <div class="user-cell">
                        ${avatarHtml}
                           
                            <div style="display:flex; flex-direction:column; margin-left: 10px;">
                                <span class="user-name">${p.nombre} ${p.apellido || ''}</span>
                                <span style="font-size:0.75rem; color:#888;">C.I: ${p.cedula || 'N/A'}</span>
                            </div>
                        </div>
                    </td>
                    <td style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${p.email}<br>
                        <span style="font-size:0.75rem; color:#666;">${p.telefono || ''}</span>
                    </td>
                    <td class="col-fixed"><span class="badge ${roleClass}">${rolStr}</span></td>
                    <td>
                        <div class="status-indicator">
                            <span class="status-dot" style="background-color: ${statusDotColor};"></span> ${statusText}
                        </div>
                    </td>
                    <td class="col-fixed">
                        <div class="actions-cell">
                            <button class="btn-sm edit" onclick="abrirEditar(${p.id})">Editar</button>
                            <button class="${btnActionClass}" onclick="toggleEstado(${p.id}, ${isActivo})">
                                ${btnActionText}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    
    // --- FUNCION NUEVA: TOGGLE ESTADO ---
    window.toggleEstado = async (id, estadoActual) => {
        const accion = estadoActual ? "desactivar" : "activar";
        if(!confirm(`¿Estás seguro de ${accion} a este empleado?`)) return;

        try {
            const res = await fetch(`/api/usuarios/personal/${id}/toggle`, { method: 'PUT' });
            if(res.ok) {
                cargarPersonal(); // Recargar tabla para ver cambios
            } else {
                mostrarNotificacion("No se pudo cambiar el estado del empleado", "error");
            }
        } catch(e) { console.error(e); }
    };

    // 3. BUSCADOR (Actualizado para buscar por cédula también)
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = personalData.filter(p => 
                (p.nombre && p.nombre.toLowerCase().includes(term)) ||
                (p.apellido && p.apellido.toLowerCase().includes(term)) ||
                (p.cedula && p.cedula.toString().includes(term)) ||
                (p.email && p.email.toLowerCase().includes(term)) ||
                (p.rol && p.rol.toLowerCase().includes(term))
            );
            renderizarTabla(filtrados);
        });
    }

    // 4. CREAR EMPLEADO (Con los nuevos campos)
    const formCreate = document.getElementById('staff-form');
    if(formCreate) {
        formCreate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formCreate.querySelector('button[type="submit"]');
            btn.textContent = "Guardando..."; btn.disabled = true;

            const nuevo = {
                cedula: document.getElementById('staff-cedula').value,
                nombre: document.getElementById('staff-name').value,
                apellido: document.getElementById('staff-lastname').value,
                email: document.getElementById('staff-email').value,
                telefono: document.getElementById('staff-phone').value,
                rol: document.getElementById('staff-role').value
                // password: El backend debe poner '123456' si llega nulo
            };

            try {
                const res = await fetch('/api/usuarios/personal', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(nuevo)
                });

                if(res.ok) {
                        mostrarNotificacion("Empleado registrado exitosamente", "exito");
                    document.getElementById('staffModal').classList.remove('active');
                    formCreate.reset();
                    cargarPersonal();
                } else {
                    const err = await res.json();
                    mostrarNotificacion(err.error || "Error al crear (verifique que la cédula o correo no existan)", "error");
                }
            } catch(error) { console.error(error); mostrarNotificacion("Error de conexión", "error"); }
            
            btn.textContent = "Crear Usuario"; btn.disabled = false;
        });
    }

    // 5. EDITAR EMPLEADO (Llenar todos los campos)
    const modalEdit = document.getElementById('editStaffModal');
    const formEdit = document.getElementById('edit-form');

    window.abrirEditar = (id) => {
        const emp = personalData.find(p => p.id === id);
        if(!emp) return;

        document.getElementById('edit-id').value = id;
        document.getElementById('edit-cedula').value = emp.cedula || '';
        document.getElementById('edit-name').value = emp.nombre;
        document.getElementById('edit-lastname').value = emp.apellido || '';
        document.getElementById('edit-email').value = emp.email;
        document.getElementById('edit-phone').value = emp.telefono || '';
        
        // Ajustar valor del select (mapeo si el backend devuelve mayusculas/minusculas)
        const rolVal = (emp.rol === 'GERENTE') ? 'GERENTE' : (emp.rol === 'VERIFICADOR' ? 'VERIFICADOR' : emp.rol);
        document.getElementById('edit-role').value = rolVal; 

        modalEdit.classList.add('active');
    };

    if(formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const updated = {
                cedula: document.getElementById('edit-cedula').value,
                nombre: document.getElementById('edit-name').value,
                apellido: document.getElementById('edit-lastname').value,
                email: document.getElementById('edit-email').value,
                telefono: document.getElementById('edit-phone').value,
                rol: document.getElementById('edit-role').value
            };

            try {
                const res = await fetch(`/api/usuarios/personal/${id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(updated)
                });
                if(res.ok) {
                    mostrarNotificacion("Empleado actualizado exitosamente", "exito");
                    modalEdit.classList.remove('active');
                    cargarPersonal();
                } else {
                    mostrarNotificacion("No se pudo actualizar el empleado", "error");
                }
            } catch(e) { console.error(e); }
        });
    }

    // 6. ELIMINAR EMPLEADO (Igual que antes)
    window.eliminarPersonal = async (id) => {
        if(!confirm("¿Estás seguro de eliminar a este empleado?")) return;
        try {
            const res = await fetch(`/api/usuarios/personal/${id}`, { method: 'DELETE' });
            if(res.ok) {
                mostrarNotificacion("Empleado eliminado exitosamente", "exito");
                cargarPersonal();
            } else {
                mostrarNotificacion("No se pudo eliminar el empleado", "error");
            }
        } catch(e) { console.error(e); }
    };

    // --- MANEJO DE MODALES ---
    const btnAdd = document.getElementById('btnAddStaff');
    const modalCreate = document.getElementById('staffModal');
    const closeCreate = document.getElementById('closeStaffModal');
    const closeEdit = document.getElementById('closeEditModal');

    if(btnAdd) btnAdd.addEventListener('click', () => modalCreate.classList.add('active'));
    if(closeCreate) closeCreate.addEventListener('click', () => modalCreate.classList.remove('active'));
    if(closeEdit) closeEdit.addEventListener('click', () => modalEdit.classList.remove('active'));

    window.addEventListener('click', (e) => {
        if(e.target === modalCreate) modalCreate.classList.remove('active');
        if(e.target === modalEdit) modalEdit.classList.remove('active');
    });
});