document.addEventListener('DOMContentLoaded', () => {

    // Función Global de Notificaciones (Offline)
window.mostrarNotificacion = (mensaje, tipo = 'exito') => {
    // 1. Crear el elemento HTML en el aire
    const toast = document.createElement('div');
    toast.className = `toast-notificacion toast-${tipo}`;
    
    // Iconos simples (usando emojis para no depender de librerías de iconos)
    const icono = tipo === 'exito' ? '✅' : '❌';
    
    toast.innerHTML = `
        <span class="toast-icono" style="font-size: 1.2rem;">${icono}</span>
        <span style="font-weight: 500;">${mensaje}</span>
    `;

    // 2. Agregarlo al cuerpo de la página
    document.body.appendChild(toast);

    // 3. Hacer que aparezca (animación) después de un milisegundo
    setTimeout(() => {
        toast.classList.add('toast-visible');
    }, 10);

    // 4. Quitarlo automáticamente después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        // Esperar a que termine la animación de salida para borrarlo del HTML
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
};

    // 1. GESTIÓN DE SESIÓN
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get('id');

    // Validamos que el ID de la URL sea real y no "null"
    if (userId && userId !== "null" && userId !== "undefined") {
        localStorage.setItem('userId', userId);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        userId = localStorage.getItem('userId');
    }
    
    if (userId === "null" || userId === "undefined") {
        console.warn("ID inválido detectado. Limpiando sesión.");
        localStorage.removeItem('userId');
        userId = null;
    }

    if (userId) {
        fetch(`/api/estudiante/dashboard/${userId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    const nameDisplay = document.querySelector('.user-name-display');
                    const roleDisplay = document.querySelector('.user-role-display');
                    if (nameDisplay) nameDisplay.textContent = `${data.nombre} ${data.apellido || ''}`;
                    if (roleDisplay) roleDisplay.textContent = data.rol || 'Dueño';
                }
            })
            .catch(err => console.log("Sesión:", err));
    }

    // 2. CARGAR IDENTIDAD GLOBAL
    if (userId) {
        cargarIdentidadGlobal(userId);
    } else {
        if (!window.location.href.includes('login.html')) {
            console.warn("No hay sesión activa");
        }
    }

    // Conexión al backend
    async function cargarIdentidadGlobal(id) {
        try {
            // Usar endpoint del dashboard para nombre, rol y estatus
            const response = await fetch(`/api/usuarios/perfil/${id}`);
            if (response.ok) {
                const data = await response.json();
                
                // Actualizar sidebars
                actualizarSidebars(data);

                // Avisar a la página que tenemos datos
                const event = new CustomEvent('usuarioListo', { detail: data });
                document.dispatchEvent(event);
            }
        } catch (error) {
            console.error("Error cargando identidad:", error);
        }
    }

    // Actualizar sidebars izquierda y derecha
    function actualizarSidebars(data) {
        // Sidebar Izquierda (Abajo)
        const leftName = document.querySelector('.sidebar-user-section .user-name-display');
        const leftRole = document.querySelector('.sidebar-user-section .user-role-display');
        
        if (leftName) leftName.textContent = `${data.nombre} ${data.apellido}`;
        if (leftRole) leftRole.textContent = data.rol;

        // Sidebar Derecha (Perfil)
        const profileName = document.querySelector('.profile-name');
        const profileEmail = document.getElementById('info-email'); 
        const profileBadge = document.querySelector('.profile-image-container .status-badge');
        
        if (profileName) profileName.textContent = `${data.nombre} ${data.apellido}`;
        if (profileEmail) profileEmail.textContent = data.email;

        // 3. FOTOS DE PERFIL 
        if (data.fotoPerfil) {
             const rutaFoto = data.fotoPerfil + '?t=' + new Date().getTime();
             
             // A. Avatar pequeño del sidebar izquierdo
             const leftAvatar = document.querySelector('.user-avatar-sm');
             if(leftAvatar) leftAvatar.src = rutaFoto;

             // B. Avatar del menú móvil
             const mobileAvatar = document.querySelector('.mobile-profile-pic');
             if(mobileAvatar) mobileAvatar.src = rutaFoto;

             // C. Avatar grande del sidebar derecho
             const rightAvatar = document.querySelector('.profile-large-image');
             if(rightAvatar) rightAvatar.src = rutaFoto;

             // D. Avatar de la welcome card (si existe)
                const welcomeAvatar = document.querySelector('.welcome-profile-image');
                if(welcomeAvatar) welcomeAvatar.src = rutaFoto;
        }
        // Badge de Estatus en Perfil
        if (profileBadge) {
             if (data.estatus === 'SOLVENTE') {
                profileBadge.textContent = 'Solvente';
                profileBadge.style.backgroundColor = '#4CAF50'; // Verde
             } else {
                profileBadge.textContent = 'No Solvente';
                profileBadge.style.backgroundColor = '#FF5252'; // Rojo
             }
        }
    }

    const profileBtn = document.getElementById('profileBtn') || document.getElementById('mobileProfileBtn');
    const profileSidebar = document.getElementById('profileSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const overlay = document.getElementById('overlay');
    const themeToggle = document.getElementById('themeToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const navbarToggler = document.getElementById('navbarToggler');
    const leftSidebar = document.getElementById('leftSidebar');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedbackModal = document.getElementById('closeFeedbackModal');
    const feedbackForm = document.getElementById('feedback-form');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const infoFields = document.querySelectorAll('.profile-info .info-item p');
    const fileInput = document.getElementById('profileImageUpload');
    const changeBtn = document.getElementById('changePhotoBtn');
    const preview = document.getElementById('profileImagePreview');
    let isEditing = false;

    // Toggle Sidebar Perfil
    if (profileBtn && profileSidebar && overlay) {
        profileBtn.addEventListener('click', () => {
            profileSidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            profileSidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (profileSidebar) profileSidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            if (leftSidebar) leftSidebar.classList.remove('active');
            if (feedbackModal) feedbackModal.classList.remove('active');
        });
    }
    // Menú Móvil
    if (navbarToggler && leftSidebar) {
        navbarToggler.addEventListener('click', () => {
            leftSidebar.classList.toggle('active');
        });
    }
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userId');
            window.location.href = 'login.html';
        });
    }
    // Feedback Modal
    if (feedbackBtn) feedbackBtn.addEventListener('click', () => feedbackModal.classList.add('active'));
    if (closeFeedbackModal) closeFeedbackModal.addEventListener('click', () => feedbackModal.classList.remove('active'));

    // Feedback Submit
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tipo = document.getElementById('feedback-tipo').value;
            const comentario = document.getElementById('feedback-comentario').value;
            try {
                await fetch('/api/feedback/enviar', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ tipo, comentario })
                });
                mostrarNotificacion("¡Gracias! Comentario enviado.", "exito");
                feedbackForm.reset();
                feedbackModal.classList.remove('active');
            } catch (err) { 
                console.error(err); 
                mostrarNotificacion("Error enviando feedback", "error");
            }
        });
    }

    // Editar Perfil
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            isEditing = !isEditing;
            if (isEditing) {
                editProfileBtn.textContent = 'Guardar';
                editProfileBtn.style.backgroundColor = '#4CAF50';
                infoFields.forEach(p => {
                    const input = document.createElement('input');
                    input.value = p.textContent;
                    input.id = `input-${p.dataset.field}`;
                    p.style.display = 'none';
                    p.parentNode.appendChild(input);
                });
            } else {
                editProfileBtn.textContent = 'Editar';
                editProfileBtn.style.backgroundColor = '';
                infoFields.forEach(p => {
                    const input = document.getElementById(`input-${p.dataset.field}`);
                    if(input) {
                        p.textContent = input.value;
                        p.style.display = 'block';
                        input.remove();
                    }
                });
            }
        });
    }

    // Íconos SVG
    const iconMoon = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    const iconSun = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

    // Actualizar ícono del botón
    const updateThemeIcon = (isDark) => {
        if (themeToggle) {
            // Oscuro: sol, claro: luna
            themeToggle.innerHTML = isDark ? iconSun : iconMoon;
        }
    };

    // Inicializar al cargar
    const initTheme = () => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if(isDark) {
            document.body.classList.add('dark-mode');
        }
        updateThemeIcon(isDark);
    };
    initTheme();

    // Evento Click
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            
            localStorage.setItem('darkMode', isDark);
            updateThemeIcon(isDark);
        });
    }

    /* =========================================
   SISTEMA DE CONFIRMACIÓN PERSONALIZADO (Promesa)
   Uso: if (await pedirConfirmacion("¿Borrar?")) { ... }
   ========================================= */
window.pedirConfirmacion = (mensaje, titulo = "¿Estás seguro?") => {
    return new Promise((resolve) => {
        // 1. Crear el Overlay y la Caja
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-confirm-box">
                <span class="modal-titulo">${titulo}</span>
                <span class="modal-mensaje">${mensaje}</span>
                <div class="modal-botones">
                    <button id="btn-cancelar-modal" class="btn-modal btn-cancelar">Cancelar</button>
                    <button id="btn-aceptar-modal" class="btn-modal btn-aceptar">Eliminar</button>
                </div>
            </div>
        `;

        // 2. Agregar al HTML
        document.body.appendChild(overlay);

        // 3. Manejar los botones
        const btnSi = overlay.querySelector('#btn-aceptar-modal');
        const btnNo = overlay.querySelector('#btn-cancelar-modal');

        const cerrar = (respuesta) => {
            overlay.remove(); // Borrar del HTML
            resolve(respuesta); // Devolver true o false
        };

        btnSi.onclick = () => cerrar(true);
        btnNo.onclick = () => cerrar(false);
        
        // Cerrar si hace clic fuera de la caja (opcional)
        overlay.onclick = (e) => {
            if (e.target === overlay) cerrar(false);
        };
    });
};

});