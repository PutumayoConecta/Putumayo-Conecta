let activeRequests = 0;
let loadingTimeout = null;
const MINIMUM_LOADING_TIME = 500; // Tiempo mínimo de visualización del spinner en milisegundos

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (show) {
        activeRequests++;
        if (activeRequests === 1) { // Solo mostrar el spinner si es la primera solicitud activa
            loadingElement.style.display = 'block';
            // Asegurarse de que el temporizador anterior esté limpio
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
        }
    } else {
        activeRequests--;
        if (activeRequests <= 0) {
            activeRequests = 0; // Evitar valores negativos
            const hideLoading = () => {
                loadingElement.style.display = 'none';
                loadingTimeout = null;
            };
            // Asegurar que el spinner se muestre al menos por MINIMUM_LOADING_TIME
            const timeSinceStart = loadingTimeout ? Date.now() - loadingTimeout.startTime : 0;
            const remainingTime = MINIMUM_LOADING_TIME - timeSinceStart;
            if (remainingTime > 0) {
                loadingTimeout = setTimeout(hideLoading, remainingTime);
            } else {
                hideLoading();
            }
        }
    }
}

async function fetchData() {
    try {
        showLoading(true);
        const startTime = Date.now();
        loadingTimeout = { startTime }; // Guardar el tiempo de inicio para el temporizador

        const res = await fetch('/api/producers', { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Error fetching producers: ${res.status} - ${await res.text()}`);
        }
        const data = await res.json();
        console.log('Datos recibidos de /api/producers:', data);

        // Asegurar que el tiempo mínimo se cumpla incluso si la solicitud es rápida
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MINIMUM_LOADING_TIME - elapsedTime;
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

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
        console.log('Tracking click for producerId:', producerId, 'WhatsApp:', whatsappNumber);
        await fetch('/api/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producerId: producerId.toString() })
        });
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        if (!cleanNumber) {
            throw new Error('Número de WhatsApp inválido después de limpiar');
        }
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=Hola,%20estoy%20interesado%20en%20tu%20emprendimiento%20en%20Putumayo%20Conecta`;
        console.log('Opening WhatsApp URL:', whatsappUrl);
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error tracking click:', error);
        if (whatsappNumber) {
            const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
            if (cleanNumber) {
                const whatsappUrl = `https://wa.me/${cleanNumber}?text=Hola,%20estoy%20interesado%20en%20tu%20emprendimiento%20en%20Putumayo%20Conecta`;
                console.log('Opening WhatsApp URL (fallback):', whatsappUrl);
                window.open(whatsappUrl, '_blank');
            } else {
                console.error('No se puede abrir WhatsApp: número inválido');
            }
        }
    }
}

let currentCategory = 'all';
let glowAnimationRunning = false;

async function loadProducers(searchQuery = "", category = currentCategory) {
    const producersList = document.getElementById('producers-list');
    const countElement = document.getElementById('count');
    producersList.innerHTML = '<p>Cargando productores...</p>';
    
    let producers = await fetchData();
    
    console.log('Productores cargados:', producers);
    
    let filteredProducers = producers;
    
    if (searchQuery) {
        searchQuery = searchQuery.toLowerCase();
        filteredProducers = filteredProducers.filter(producer =>
            producer.name.toLowerCase().includes(searchQuery) ||
            producer.product.toLowerCase().includes(searchQuery)
        );
    }
    
    if (category !== 'all') {
        filteredProducers = filteredProducers.filter(producer =>
            producer.category.toLowerCase() === category
        );
    }
    
    producersList.setAttribute('data-count', filteredProducers.length);
    countElement.textContent = filteredProducers.length;
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
        
        const optimizedImage = producer.image ? `${producer.image}?w=300&h=200&f=auto&q=80` : '/images/logo.png';
        const card = document.createElement('div');
        card.className = 'producer-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="card-image">
                <img src="${optimizedImage}" alt="${producer.product}" loading="lazy" onerror="this.src='/images/logo.png';">
                <div class="image-overlay"></div>
                <span class="category-badge ${producer.category.toLowerCase()}">${categoryName}</span>
            </div>
            <div class="producer-info">
                <h3>${producer.name}</h3>
                <div class="info-row">
                    <span class="label">Producto:</span>
                    <span class="value">${producer.product}</span>
                </div>
                <div class="info-row">
                    <span class="label">Ubicación:</span>
                    <span class="value">${producer.location}</span>
                </div>
                <p class="description">${producer.description}</p>
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
            if (navigator.vibrate) {
                navigator.vibrate(50);
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

        subButtons.forEach(btn => {
            btn.classList.remove('glow');
            const label = btn.querySelector('.category-label');
            if (label) label.classList.remove('visible');
        });

        const currentButton = subButtons[currentIndex];
        currentButton.classList.add('glow');
        const label = currentButton.querySelector('.category-label');
        if (label) label.classList.add('visible');

        currentIndex = (currentIndex + 1) % subButtons.length;
        setTimeout(glowNextButton, 1000);
    }

    glowNextButton();
}

function stopGlowAnimation() {
    glowAnimationRunning = false;
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');
    subButtons.forEach(btn => {
        btn.classList.remove('glow');
        const label = btn.querySelector('.category-label');
        if (label) label.classList.remove('visible');
    });
}

function setupCategoryButtons() {
    const categoryIcons = {
        'all': '<i class="fas fa-star"></i>',
        'agricultura': '<i class="fas fa-leaf"></i>',
        'agroindustria': '<i class="fas fa-industry"></i>',
        'artesania': '<i class="fas fa-cut"></i>',
        'gastronomia': '<i class="fas fa-utensils"></i>',
        'turismo': '<i class="fas fa-map-marked-alt"></i>',
        'varios': '<i class="fas fa-box"></i>'
    };

    const categoryLabels = {
        'all': 'Todos',
        'agricultura': 'Agricultura',
        'agroindustria': 'Agroindustria',
        'artesania': 'Artesanía',
        'gastronomia': 'Gastronomía',
        'turismo': 'Turismo',
        'varios': 'Varios'
    };

    const mainButton = document.querySelector('.category-btn.main-btn');
    const categoryMenu = document.querySelector('.category-menu');
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');

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

    mainButton.classList.add('active');

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
            e.stopPropagation();
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            console.log(`Clic en categoría: ${category}`);
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

    mainButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navigator.vibrate) {
            navigator.vibrate(50);
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

    mainButton.addEventListener('click', (e) => {
        if (currentCategory !== 'all') {
            if (navigator.vibrate) {
                navigator.vibrate(50);
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

        const whatsappNumber = form.querySelector('#whatsapp').value.replace(/[^0-9]/g, '');
        if (!whatsappNumber) {
            formMessage.textContent = 'Por favor, ingresa un número de WhatsApp válido.';
            return;
        }

        formMessage.textContent = 'Enviando...';
        
        const formData = new FormData(form);
        const producerId = Date.now().toString();
        formData.append('producerId', producerId);

        // Combine country code and phone number
        const countryCode = form.querySelector('#country-code').value;
        const fullWhatsappNumber = `${countryCode}${whatsappNumber}`;
        formData.set('whatsapp', fullWhatsappNumber);

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

    // Defer loading of background images
    setTimeout(() => {
        document.documentElement.style.setProperty('--body-bg', "url('/images/selva2.jpg')");
        document.documentElement.style.setProperty('--header-bg', "url('/images/selva1.jpg')");
        document.documentElement.style.setProperty('--footer-bg', "url('/images/selva3.jpg')");
    }, 0);
}

init();