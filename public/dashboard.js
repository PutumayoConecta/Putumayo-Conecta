// Variables globales
let userData = {}; // Aquí guardaremos los datos actuales

// Función para cargar estadísticas con diseño mejorado
async function loadStats(producerId) {
    try {
        const statsResponse = await fetch(`/api/stats/${producerId}`);
        const statsData = await statsResponse.json();
        const clicksCount = document.getElementById('clicks-count');
        
        if (statsResponse.ok) {
            // Animación para el contador
            animateValue(clicksCount, 0, statsData.clicks, 1000);
        } else {
            clicksCount.textContent = '0';
            console.error('Error en stats:', statsData);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('clicks-count').textContent = '0';
    }
}

// Animación para el contador de clics
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Configuración del formulario de login (mejorado)
function setupLoginForm() {
    const form = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const loginSection = document.getElementById('login-section');
    const statsSection = document.getElementById('stats-section');

    // Autocompletar credenciales si existen
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    
    if (savedEmail && savedPassword) {
        form.email.value = savedEmail;
        form.password.value = savedPassword;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = 'Verificando tus datos...';
        loginMessage.style.color = '#2e7d32';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: form.email.value, 
                    password: form.password.value 
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                loginSection.style.display = 'none';
                statsSection.style.display = 'block';
                loadStats(result.producerId);
            } else {
                throw new Error(result.error || 'Credenciales incorrectas');
            }
        } catch (error) {
            loginMessage.textContent = error.message;
            loginMessage.style.color = '#e74c3c';
        }
    });
}

// Modo oscuro (consistente con index.html)
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

// Abrir modal de edición
document.getElementById('edit-profile-btn').addEventListener('click', () => {
    document.getElementById('edit-modal').style.display = 'block';
    // Cargar datos actuales (simulado)
    userData = {
        description: "Texto actual de tu emprendimiento",
        goal: 50
    };
    
    // Rellenar formulario con datos existentes
    document.querySelector('#edit-form textarea').value = userData.description;
    document.querySelector('#edit-form input[name="goal"]').value = userData.goal;
});

// Cerrar modal
document.querySelector('#edit-modal .close').addEventListener('click', () => {
    document.getElementById('edit-modal').style.display = 'none';
});

// Enviar formulario de edición
document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            body: formData // ¡Importante! No uses headers para FormData
        });
        
        if (response.ok) {
            alert("¡Perfil actualizado!");
            location.reload(); // Recargar para ver cambios
        }
    } catch (error) {
        alert("Error al guardar: " + error.message);
    }
});

// Cargar meta al iniciar (ejemplo)
async function loadGoal() {
    const response = await fetch('/api/user-goal');
    const data = await response.json();
    
    const progressBar = document.getElementById('progress-bar');
    const goalText = document.getElementById('goal-text');
    
    progressBar.value = data.progress;
    progressBar.max = data.goal;
    goalText.textContent = `¡Faltan ${data.goal - data.progress} contactos para tu meta!`;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setupLoginForm();
    setupDarkMode();
    loadGoal();
});