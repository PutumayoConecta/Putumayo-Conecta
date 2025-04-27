function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

async function fetchData() {
    try {
        showLoading(true);
        const res = await fetch('/api/producers', { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Error fetching producers: ${res.status} - ${await res.text()}`);
        }
        const data = await res.json();
        console.log('Datos recibidos de /api/producers:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    } finally {
        showLoading(false);
    }
}

async function trackClick(producerId, whatsappNumber) {
    try {
        if (!producerId || !whatsappNumber) {
            throw new Error('Faltan datos: producerId o whatsappNumber no están definidos');
        }
        await fetch('/api/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producerId: producerId.toString() })
        });
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}`;
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error tracking click:', error);
        if (whatsappNumber) {
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}`;
            window.open(whatsappUrl, '_blank');
        }
    }
}

let currentCategory = 'all'; // Variable para rastrear la categoría seleccionada
let glowAnimationRunning = false; // Variable para controlar la animación de iluminación

async function loadProducers(searchQuery = "", category = currentCategory) {
    const producersList = document.getElementById('producers-list');
    const countElement = document.getElementById('count');
    producersList.innerHTML = '<p>Cargando productores...</p>';
    
    let producers = await fetchData();
    
    console.log('Productores cargados:', producers);
    
    let filteredProducers = producers;
    
    // Filtrar por búsqueda
    if (searchQuery) {
        searchQuery = searchQuery.toLowerCase();
        filteredProducers = filteredProducers.filter(producer =>
            producer.name.toLowerCase().includes(searchQuery) ||
            producer.product.toLowerCase().includes(searchQuery)
        );
    }
    
    // Filtrar por categoría
    if (category !== 'all') {
        filteredProducers = filteredProducers.filter(producer =>
            producer.category.toLowerCase() === category
        );
    }
    
    producersList.setAttribute('data-count', filteredProducers.length);
    countElement.textContent = filteredProducers.length; // Actualiza el contador dinámico
    producersList.innerHTML = '';
    
    if (filteredProducers.length === 0) {
        producersList.innerHTML = '<p>No se encontraron emprendimientos.</p>';
        return;
    }
    
    filteredProducers.forEach((producer, index) => {
        const categoryName = 
            producer.category.toLowerCase() === 'agricultura' ? 'Agricultura' : 
            producer.category.toLowerCase() === 'artesania' ? 'Artesanía' : 
            producer.category.toLowerCase() === 'turismo' ? 'Turismo' :
            producer.category.toLowerCase() === 'gastronomia' ? 'Gastronomía' :
            producer.category.toLowerCase() === 'agroindustria' ? 'Agroindustria' :
            'Varios';
        
        const card = document.createElement('div');
        card.className = 'producer-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <img src="${producer.image || '/images/logo.png'}" alt="${producer.product}" loading="lazy">
            <div class="producer-info">
                <h3>${producer.name}</h3>
                <span class="category-badge ${producer.category.toLowerCase()}">${categoryName}</span>
                <p><strong>Producto:</strong> ${producer.product}</p>
                <p><strong>Ubicación:</strong> ${producer.location}</p>
                <p>${producer.description}</p>
                <a href="#" class="producer-whatsapp-btn whatsapp-btn" data-producer-id="${producer.id}" data-whatsapp="${producer.whatsapp}">
                    <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                </a>
            </div>
        `;
        producersList.appendChild(card);
    });

    document.querySelectorAll('.producer-whatsapp-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            // Añadir vibración al hacer clic
            if (navigator.vibrate) {
                navigator.vibrate(50); // Vibración de 50ms
            }
            const producerId = button.dataset.producerId;
            const whatsappNumber = button.dataset.whatsapp;
            trackClick(producerId, whatsappNumber);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => {
        loadProducers(searchInput.value, currentCategory);
    });
}

function startGlowAnimation() {
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');
    let currentIndex = 0;
    glowAnimationRunning = true;

    function glowNextButton() {
        if (!glowAnimationRunning) return;

        // Remover la clase 'glow' de todos los botones
        subButtons.forEach(btn => btn.classList.remove('glow'));

        // Añadir la clase 'glow' al botón actual
        subButtons[currentIndex].classList.add('glow');

        // Avanzar al siguiente botón
        currentIndex = (currentIndex + 1) % subButtons.length;

        // Repetir cada 1 segundo
        setTimeout(glowNextButton, 1000);
    }

    glowNextButton();
}

function stopGlowAnimation() {
    glowAnimationRunning = false;
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');
    subButtons.forEach(btn => btn.classList.remove('glow'));
}

function setupCategoryButtons() {
    const categoryIcons = {
        'all': '<i class="fas fa-star"></i>',
        'agricultura': '<i class="fas fa-leaf"></i>',
        'artesania': '<i class="fas fa-cut"></i>',
        'turismo': '<i class="fas fa-map-marked-alt"></i>',
        'gastronomia': '<i class="fas fa-utensils"></i>',
        'agroindustria': '<i class="fas fa-industry"></i>',
        'varios': '<i class="fas fa-box"></i>'
    };

    const categoryLabels = {
        'all': 'Todos',
        'agricultura': 'Agricultura',
        'artesania': 'Artesanía',
        'turismo': 'Turismo',
        'gastronomia': 'Gastronomía',
        'agroindustria': 'Agroindustria',
        'varios': 'Varios'
    };

    const mainButton = document.querySelector('.category-btn.main-btn');
    const categoryMenu = document.querySelector('.category-menu');
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');

    // Establecer el ícono y el texto curvo del botón principal
    mainButton.querySelector('i').outerHTML = categoryIcons['all'];
    const mainLabel = mainButton.querySelector('.category-label');
    mainLabel.innerHTML = `
        <svg viewBox="0 0 70 70">
            <path id="curve-all" d="M 35,60 A 25,25 0 0,1 35,10 A 25,25 0 0,1 35,60 Z" fill="none" />
            <text>
                <textPath href="#curve-all" startOffset="50%" text-anchor="middle">
                    ${categoryLabels['all']}
                </textPath>
            </text>
        </svg>
    `;

    // Establecer el botón "Todos" como activo por defecto
    mainButton.classList.add('active');

    // Configurar los botones de categorías con texto curvo
    subButtons.forEach(button => {
        const category = button.dataset.category;
        button.querySelector('i').outerHTML = categoryIcons[category] || '';
        const subLabel = button.querySelector('.category-label');
        subLabel.innerHTML = `
            <svg viewBox="0 0 70 70">
                <path id="curve-${category}" d="M 35,60 A 25,25 0 0,1 35,10 A 25,25 0 0,1 35,60 Z" fill="none" />
                <text>
                    <textPath href="#curve-${category}" startOffset="50%" text-anchor="middle">
                        ${categoryLabels[category]}
                    </textPath>
                </text>
            </svg>
        `;
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que el evento se propague
            // Añadir vibración al hacer clic
            if (navigator.vibrate) {
                navigator.vibrate(50); // Vibración de 50ms
            }
            console.log(`Clic en categoría: ${category}`); // Depuración
            stopGlowAnimation();
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = category;
            loadProducers(document.getElementById('search-input').value, currentCategory);
            categoryMenu.classList.remove('open');
            mainButton.querySelector('i').outerHTML = categoryIcons[currentCategory];
            const updatedMainLabel = mainButton.querySelector('.category-label');
            updatedMainLabel.innerHTML = `
                <svg viewBox="0 0 70 70">
                    <path id="curve-${currentCategory}" d="M 35,60 A 25,25 0 0,1 35,10 A 25,25 0 0,1 35,60 Z" fill="none" />
                    <text>
                        <textPath href="#curve-${currentCategory}" startOffset="50%" text-anchor="middle">
                            ${categoryLabels[currentCategory]}
                        </textPath>
                    </text>
                </svg>
            `;
        });
    });

    // Manejar el clic en el botón principal para desplegar/ocultar el menú
    mainButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que el evento se propague
        // Añadir vibración al hacer clic
        if (navigator.vibrate) {
            navigator.vibrate(50); // Vibración de 50ms
        }
        const isOpen = categoryMenu.classList.contains('open');
        if (isOpen) {
            categoryMenu.classList.remove('open');
            stopGlowAnimation();
        } else {
            categoryMenu.classList.add('open');
            startGlowAnimation();
        }
    });

    // Manejar el clic en el botón "Todos" cuando ya está seleccionado
    mainButton.addEventListener('click', (e) => {
        if (currentCategory !== 'all') {
            // Añadir vibración al hacer clic
            if (navigator.vibrate) {
                navigator.vibrate(50); // Vibración de 50ms
            }
            stopGlowAnimation();
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            mainButton.classList.add('active');
            currentCategory = 'all';
            loadProducers(document.getElementById('search-input').value, currentCategory);
            mainButton.querySelector('i').outerHTML = categoryIcons['all'];
            const updatedMainLabel = mainButton.querySelector('.category-label');
            updatedMainLabel.innerHTML = `
                <svg viewBox="0 0 70 70">
                    <path id="curve-all" d="M 35,60 A 25,25 0 0,1 35,10 A 25,25 0 0,1 35,60 Z" fill="none" />
                    <text>
                        <textPath href="#curve-all" startOffset="50%" text-anchor="middle">
                            ${categoryLabels['all']}
                        </textPath>
                    </text>
                </svg>
            `;
        }
    });

    // Cerrar el menú y detener la animación si se hace clic fuera de él
    document.addEventListener('click', (e) => {
        if (!categoryMenu.contains(e.target) && !mainButton.contains(e.target)) {
            categoryMenu.classList.remove('open');
            stopGlowAnimation();
        }
    });
}

function setupModal() {
    const modal = document.getElementById('modal');
    const addBtn = document.getElementById('add-btn');
    const closeBtn = document.querySelector('.close');
    
    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function setupForm() {
    const form = document.getElementById('register-form');
    const formMessage = document.getElementById('form-message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const imageInput = form.querySelector('input[name="image"]');
        if (!imageInput.files || imageInput.files.length === 0) {
            formMessage.textContent = 'Por favor, selecciona una imagen para tu emprendimiento.';
            return;
        }

        formMessage.textContent = 'Enviando...';
        
        const formData = new FormData(form);
        const producerId = Date.now().toString();
        formData.append('producerId', producerId);

        try {
            const response = await fetch('/api/register-user', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al registrar el emprendimiento');
            }

            formMessage.textContent = '¡Emprendimiento y usuario registrados con éxito!';

            const email = formData.get('email');
            const password = formData.get('password');
            const saveCredentials = confirm('¿Deseas guardar tu usuario y contraseña para futuros ingresos?');
            if (saveCredentials) {
                localStorage.setItem('savedEmail', email);
                localStorage.setItem('savedPassword', password);
            }

            form.reset();
            setTimeout(() => {
                document.getElementById('modal').style.display = 'none';
                formMessage.textContent = '';
                loadProducers(document.getElementById('search-input').value, currentCategory);
            }, 2000);
        } catch (error) {
            formMessage.textContent = error.message || 'Error al registrar. Intenta de nuevo.';
            console.error('Error:', error);
        }
    });
}

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

function init() {
    setupSearch();
    setupCategoryButtons();
    setupModal();
    setupForm();
    setupDarkMode();
    loadProducers();
}

init();