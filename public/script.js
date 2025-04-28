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
        
        // Registrar el click en tu backend
        await fetch('/api/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producerId: producerId.toString() })
        });
        
        // Limpiar y formatear el número de WhatsApp
        const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '');
        
        // Asegurar que tenga el código de país si es un número colombiano
        const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : 
                              (cleanNumber.length === 10 ? '+57' + cleanNumber : cleanNumber);
        
        // Crear enlace universal que funciona en móviles y desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const message = encodeURIComponent('Hola, estoy interesado en tu emprendimiento en Putumayo Conecta');
        const whatsappUrl = isMobile 
            ? `whatsapp://send?phone=${formattedNumber}&text=${message}`
            : `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${message}`;
        
        // Abrir WhatsApp directamente
        window.location.href = whatsappUrl;
        
    } catch (error) {
        console.error('Error tracking click:', error);
        // Fallback a wa.me si hay error
        const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '');
        window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
}

let currentCategory = 'all';
let glowAnimationRunning = false;
let glowInterval = null;

function startGlowAnimation() {
    if (glowAnimationRunning) return;
    
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');
    let currentIndex = 0;
    glowAnimationRunning = true;

    function glowNextButton() {
        if (!glowAnimationRunning || !document.querySelector('.category-menu.open')) {
            stopGlowAnimation();
            return;
        }

        subButtons.forEach(btn => {
            btn.classList.remove('glow');
            const label = btn.querySelector('.category-label');
            if (label) label.classList.remove('visible');
        });

        const currentButton = subButtons[currentIndex];
        if (currentButton) {
            currentButton.classList.add('glow');
            const label = currentButton.querySelector('.category-label');
            if (label) label.classList.add('visible');
        }

        currentIndex = (currentIndex + 1) % subButtons.length;
    }

    glowInterval = setInterval(glowNextButton, 1500);
    glowNextButton();
}

function stopGlowAnimation() {
    glowAnimationRunning = false;
    if (glowInterval) {
        clearInterval(glowInterval);
        glowInterval = null;
    }
    
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');
    subButtons.forEach(btn => {
        btn.classList.remove('glow');
        const label = btn.querySelector('.category-label');
        if (label) label.classList.remove('visible');
    });
}

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
    let searchTimeout;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadProducers(searchInput.value, currentCategory);
        }, 300);
    });
}

function createCategorySvg(category, label) {
    return `
        <svg viewBox="0 0 70 70">
            <path id="curve-${category}" d="M 35,60 A 25,25 0 0,1 35,10 A 25,25 0 0,1 35,60 Z" fill="none" />
            <text>
                <textPath href="#curve-${category}" startOffset="50%" text-anchor="middle">
                    ${label}
                </textPath>
            </text>
        </svg>
    `;
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
    mainLabel.innerHTML = createCategorySvg('all', categoryLabels['all']);
    mainButton.classList.add('active');

    subButtons.forEach(button => {
        const category = button.dataset.category;
        button.querySelector('i').outerHTML = categoryIcons[category] || '';
        const subLabel = button.querySelector('.category-label');
        subLabel.innerHTML = createCategorySvg(category, categoryLabels[category]);

        button.style.pointerEvents = 'auto';

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            stopGlowAnimation();
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = category;
            loadProducers(document.getElementById('search-input').value, currentCategory);
            categoryMenu.classList.remove('open');
            mainButton.querySelector('i').outerHTML = categoryIcons[currentCategory];
            const updatedMainLabel = mainButton.querySelector('.category-label');
            updatedMainLabel.innerHTML = createCategorySvg(currentCategory, categoryLabels[currentCategory]);
        });

        button.addEventListener('mouseenter', () => {
            stopGlowAnimation();
            button.classList.add('glow');
            const label = button.querySelector('.category-label');
            if (label) label.classList.add('visible');
        });

        button.addEventListener('mouseleave', () => {
            button.classList.remove('glow');
            const label = button.querySelector('.category-label');
            if (label) label.classList.remove('visible');
        });
    });

    mainButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        const isOpen = categoryMenu.classList.contains('open');
        
        document.querySelectorAll('.category-menu.open').forEach(menu => {
            menu.classList.remove('open');
        });
        
        if (!isOpen) {
            categoryMenu.classList.add('open');
            startGlowAnimation();
        } else {
            stopGlowAnimation();
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
    
    // Manejar clics en enlaces WhatsApp del footer
    const footerWhatsappBtn = document.querySelector('footer .whatsapp-btn');
    if (footerWhatsappBtn) {
        footerWhatsappBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const originalHref = this.getAttribute('href');
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Reemplazar https://wa.me por whatsapp:// para abrir directamente la app
                const directHref = originalHref.replace('https://wa.me', 'whatsapp://send');
                window.location.href = directHref;
            } else {
                window.open(originalHref, '_blank');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);