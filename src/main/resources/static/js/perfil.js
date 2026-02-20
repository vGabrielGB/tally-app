/* ======================================== */
/* LÓGICA DE LA PÁGINA DE PERFIL (perfil.js) */
/* ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Validar Sesión
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('formPerfil');
    const inputFoto = document.getElementById('inputFoto'); 
    const avatarPreview = document.getElementById('avatarPreview');
    
    // Textos de Cabecera
    const displayNombre = document.getElementById('displayNombre');
    const displayRol = document.getElementById('displayRol');

    // Inputs del Formulario
    const inputNombre = document.getElementById('inputNombre');
    const inputApellido = document.getElementById('inputApellido');
    const inputCedula = document.getElementById('inputCedula');
    const inputTelefono = document.getElementById('inputTelefono');
    const inputEmail = document.getElementById('inputEmail'); // ¡Este era el que fallaba!
    
    const inputPass = document.getElementById('inputPassword');
    const inputConfirm = document.getElementById('inputConfirmPassword');
    const btnGuardar = document.getElementById('btnGuardar');

    // 1. CARGAR DATOS AL ENTRAR
    cargarDatosPerfil();

    async function cargarDatosPerfil() {
        try {
            // CORRECCIÓN: Usamos el endpoint de PERFIL, no el de dashboard
            const res = await fetch(`/api/usuarios/perfil/${userId}`);
            
            if (res.ok) {
                const user = await res.json();
                
                // A. Llenar Imagen
                if(user.fotoPerfil) {
                    const rutaFoto = user.fotoPerfil; 
                    // Truco del timestamp (?t=...) para obligar a recargar la imagen si cambió
                    const urlConCache = rutaFoto + '?t=' + new Date().getTime();
                    
                    if(avatarPreview) avatarPreview.src = urlConCache;
                    
                    // Actualizar también las miniaturas del sidebar/navbar
                    const miniaturas = document.querySelectorAll('.user-avatar-sm, .mobile-profile-pic');
                    miniaturas.forEach(img => img.src = urlConCache);
                }
                
                // B. Llenar Textos
                if(displayNombre) displayNombre.textContent = `${user.nombre} ${user.apellido || ''}`;
                if(displayRol) displayRol.textContent = user.rol;

                // C. Llenar Inputs (Aquí se carga el email)
                inputNombre.value = user.nombre || '';
                inputApellido.value = user.apellido || '';
                inputCedula.value = user.cedula || '';
                inputTelefono.value = user.telefono || '';
                inputEmail.value = user.email || ''; // <--- AHORA SÍ SE LLENARÁ
            }
        } catch (e) {
            console.error("Error cargando perfil", e);
        }
    }


    // 3. GUARDAR CAMBIOS DE TEXTO
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validar contraseñas
            const p1 = inputPass.value;
            const p2 = inputConfirm.value;
            if (p1 && p1 !== p2) {
         
                mostrarNotificacion("Las contraseñas no coinciden", "error");
                return;
            }

            btnGuardar.textContent = "Guardando...";
            btnGuardar.disabled = true;

            const payload = {
                id: userId,
                nombre: inputNombre.value,
                apellido: inputApellido.value,
                email: inputEmail.value,
                telefono: inputTelefono.value,
                // No enviamos rol ni cédula para evitar hackeos
            };

            if (p1) payload.password = p1;

            try {
                const res = await fetch('/api/usuarios/perfil/actualizar', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
      
                    mostrarNotificacion("Perfil actualizado correctamente", "exito");
                    cargarDatosPerfil(); // Recargar datos visuales
                    
                    // Limpiar campos password
                    inputPass.value = '';
                    inputConfirm.value = '';
                } else {
    
                    mostrarNotificacion("Error al actualizar datos", "error");
                }
            } catch (e) {
                console.error(e);
         
                mostrarNotificacion("Error de conexión con el servidor", "error");
            } finally {
                btnGuardar.textContent = "Guardar Cambios";
                btnGuardar.disabled = false;
            }
        });
    }

    // --- VARIABLES PARA EL CROPPER ---
    const cropModal = document.getElementById('cropModal');
    const imageToCrop = document.getElementById('imageToCrop');
    const btnConfirmCrop = document.getElementById('btnConfirmCrop');
    const btnCancelCrop = document.getElementById('btnCancelCrop');
    const closeCropModal = document.getElementById('closeCropModal');
    let cropper = null; // Instancia del cortador

    // 2. INTERCEPTAR SELECCIÓN DE FOTO
    if (inputFoto) {
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {

                mostrarNotificacion("Por favor selecciona una imagen válida", "error");
                return;
            }

            // Leer archivo y mostrarlo en el modal
            const reader = new FileReader();
            reader.onload = (evt) => {
                imageToCrop.src = evt.target.result;
                
                // Mostrar Modal
                cropModal.classList.add('active');

                // Si ya existía un cropper previo, destruirlo para crear uno nuevo
                if (cropper) { cropper.destroy(); }

                // Iniciar Cropper.js
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1, // Obliga a que sea cuadrado (1:1)
                    viewMode: 1,    // Restringe el cuadro dentro de la imagen
                    dragMode: 'move',
                    autoCropArea: 1,
                    minContainerWidth: 400,
                    minContainerHeight: 400,
                });
            };
            reader.readAsDataURL(file);
            
            // Limpiar input para permitir seleccionar la misma foto si se cancela
            inputFoto.value = ''; 
        });
    }

    // 3. CONFIRMAR RECORTE Y SUBIR
    if (btnConfirmCrop) {
        btnConfirmCrop.addEventListener('click', () => {
            if (!cropper) return;

            // Obtener el recorte como Canvas
            const canvas = cropper.getCroppedCanvas({
                width: 300,  
                height: 300,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });

            // Convertir Canvas a Archivo (Blob)
            canvas.toBlob(async (blob) => {
                if (!blob) return;

                // Crear FormData para enviar al backend
                const formData = new FormData();
                // Nombre del archivo: foto_recortada.jpg
                formData.append('file', blob, 'foto_perfil.jpg');

                // UI Loading
                const textoOriginal = btnConfirmCrop.innerText;
                btnConfirmCrop.innerText = "Subiendo...";
                btnConfirmCrop.disabled = true;

                try {
                    const res = await fetch(`/api/usuarios/perfil/${userId}/foto`, {
                        method: 'POST',
                        body: formData
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const nuevaUrl = data.url + '?t=' + new Date().getTime();

                        // Actualizar todas las imágenes
                        if(avatarPreview) avatarPreview.src = nuevaUrl;
                        const sidebarImgs = document.querySelectorAll('.user-avatar-sm, .mobile-profile-pic');
                        sidebarImgs.forEach(img => img.src = nuevaUrl);

                        mostrarNotificacion("Foto actualizada correctamente", "exito");
                        cerrarModalCrop(); // Cerrar modal
                    } else {
                        mostrarNotificacion("Error al guardar la imagen", "error");
                    }
                } catch (e) {
                    console.error(e);
                    mostrarNotificacion("Error de conexión con el servidor", "error");
                } finally {
                    btnConfirmCrop.innerText = textoOriginal;
                    btnConfirmCrop.disabled = false;
                }
            }, 'image/jpeg', 0.9); // Calidad JPG 90%
        });
    }

    // 4. FUNCIONES AUXILIARES (Cerrar modal)
    function cerrarModalCrop() {
        cropModal.classList.remove('active');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        imageToCrop.src = "";
    }

    if (btnCancelCrop) btnCancelCrop.addEventListener('click', cerrarModalCrop);
    if (closeCropModal) closeCropModal.addEventListener('click', cerrarModalCrop);
    
});