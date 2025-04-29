// Load stats after login
async function loadStats(producerId) {
    try {
        const statsResponse = await fetch(`/api/stats/${producerId}`);
        const statsData = await statsResponse.json();
        const statsSection = document.getElementById('stats-section');
        const clicksCount = document.getElementById('clicks-count');
        
        if (statsResponse.ok) {
            clicksCount.textContent = statsData.clicks; // Mostrar solo el número de clics
        } else {
            clicksCount.textContent = 'Error al cargar estadísticas';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('clicks-count').textContent = 'Error al cargar estadísticas';
    }
}

// Setup login form
function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) {
        console.error('Formulario de login no encontrado. Asegúrate de que el ID "login-form" esté presente en dashboard.html.');
        return;
    }

    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const loginMessage = document.getElementById('login-message');
    const loginSection = document.getElementById('login-section');
    const statsSection = document.getElementById('stats-section');

    if (!emailInput || !passwordInput || !loginMessage || !loginSection || !statsSection) {
        console.error('Campos de email, contraseña, mensaje de login, login-section o stats-section no encontrados. Verifica los IDs y atributos name.');
        return;
    }

    // Verificar y autocompletar los campos con los datos guardados en localStorage
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    console.log('Datos guardados en localStorage:', { savedEmail, savedPassword }); // Depuración

    if (savedEmail && savedPassword) {
        emailInput.value = savedEmail;
        passwordInput.value = savedPassword;
        loginMessage.textContent = 'Credenciales autocompletadas. Haz clic en "Ingresar" para continuar.';
    } else {
        loginMessage.textContent = 'No se encontraron credenciales guardadas. Por favor, ingresa tu email y contraseña.';
        console.warn('No se encontraron datos en localStorage. Asegúrate de haber aceptado guardar las credenciales al registrarte en index.html.');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = 'Iniciando sesión...';

        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            loginMessage.textContent = 'Por favor, ingresa tu correo y contraseña.';
            // Redirigir a index.html si las credenciales están vacías
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al iniciar sesión');
            }

            loginMessage.textContent = '¡Sesión iniciada con éxito!';
            loginSection.style.display = 'none';
            statsSection.style.display = 'block';
            loadStats(result.producerId);
        } catch (error) {
            loginMessage.textContent = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
            // Redirigir a index.html si las credenciales no coinciden
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
        }
    });
}

// Dark mode toggle (para mantener consistencia con index.html)
function setupDarkMode() {
    const toggle = document.getElementById('theme-toggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    toggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Initialize dashboard
function init() {
    setupLoginForm();
    setupDarkMode();
}

init();