document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorAlert = document.getElementById('error-alert');

    // Ocultar alerta al inicio
    if(errorAlert) errorAlert.style.display = 'none';

    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const cedula = document.getElementById('cedula').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');

            // Feedback visual (Cargando...)
            const btnTextoOriginal = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Verificando...";
            if(errorAlert) errorAlert.style.display = 'none';

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cedula, password })
                });

                const data = await res.json();

                if (res.ok) {
                    // ÉXITO: Guardamos sesión y redirigimos
                    localStorage.setItem('userId', data.id);
                    // Opcional: Guardar nombre para bienvenida rápida
                    localStorage.setItem('userName', data.nombre);
                    
                    window.location.href = data.redirect;
                } else {
                    // ERROR: Mostrar mensaje
                    mostrarError(data.error || "Credenciales inválidas");
                }

            } catch (error) {
                console.error(error);
                mostrarError("Error de conexión con el servidor");
            } finally {
                // Restaurar botón
                btn.disabled = false;
                btn.textContent = btnTextoOriginal;
            }
        });
    }

    function mostrarError(msg) {
        if(errorAlert) {
            errorAlert.textContent = msg;
            errorAlert.style.display = 'block';
            // Pequeña animación de vibración (opcional si tienes CSS para ello)
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        } else {
            alert(msg);
        }
    }
});