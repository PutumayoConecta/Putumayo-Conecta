function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
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
    if (producerId) {
        fetch('/api/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producerId: producerId.toString() })
        }).catch(error => {
            console.error('Error al registrar el clic (continuando con WhatsApp):', error);
        });
    }

    try {
        console.log('Número de WhatsApp recibido:', whatsappNumber);

        if (!whatsappNumber) {
            throw new Error('Falta dato: whatsappNumber no está definido');
        }

        let cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');

        console.log('Número limpio:', cleanNumber);

        if (cleanNumber.length === 10) {
            cleanNumber = `57${cleanNumber}`;
        } else if (cleanNumber.length === 12 && cleanNumber.startsWith('57')) {
            cleanNumber = cleanNumber;
        } else if (cleanNumber.length === 0) {
            throw new Error('El número de WhatsApp está vacío');
        } else {
            throw new Error(`El número de WhatsApp debe tener 10 dígitos (ej. 3227994023) o el formato +571234567890. Valor recibido: ${cleanNumber}`);
        }

        const message = encodeURIComponent('Hola, estoy interesado en tu emprendimiento en Putumayo Conecta');
        const whatsappUrl = `https://wa.me/+${cleanNumber}?text=${message}`;

        console.log('Enlace de WhatsApp generado:', whatsappUrl);

        // Intentar abrir WhatsApp
        const newWindow = window.open(whatsappUrl, '_blank');
        setTimeout(() => {
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                alert('Parece que WhatsApp no está instalado. Por favor, instala WhatsApp o contacta manualmente al número: +' + cleanNumber);
            }
        }, 1000);

    } catch (error) {
        console.error('Error al abrir WhatsApp:', error);
        alert('No se pudo abrir WhatsApp. Por favor, verifica que el número sea correcto (ej. 3227994023) o que la app esté instalada.');
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
        if (!glowAnimationRunning || !document.querySelector('.category-menu[aria-expanded="true"]')) {
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
        filteredProducers = filteredProducers.filter(producer => {
            const nameMatch = producer.name && producer.name.toLowerCase().includes(searchQuery);
            const productMatch = producer.product && producer.product.toLowerCase().includes(searchQuery);
            console.log(`Filtrando por búsqueda: ${producer.name}, nameMatch: ${nameMatch}, productMatch: ${productMatch}`);
            return nameMatch || productMatch;
        });
    }

    if (category !== 'all') {
        filteredProducers = filteredProducers.filter(producer => {
            const categoryMatch = producer.category && producer.category.toLowerCase() === category.toLowerCase();
            console.log(`Filtrando por categoría: ${producer.name}, categoría: ${producer.category}, coincide con ${category}: ${categoryMatch}`);
            return categoryMatch;
        });
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
            producer.category && producer.category.toLowerCase() === 'agricultura' ? 'Agricultura' :
            producer.category && producer.category.toLowerCase() === 'artesania' ? 'Artesanía' :
            producer.category && producer.category.toLowerCase() === 'turismo' ? 'Turismo' :
            producer.category && producer.category.toLowerCase() === 'gastronomia' ? 'Gastronomía' :
            producer.category && producer.category.toLowerCase() === 'agroindustria' ? 'Agroindustria' :
            'Varios';

        const card = document.createElement('div');
        card.className = 'producer-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <img src="${producer.image || '/images/logo.png'}" alt="${producer.product || 'Producto'}" loading="lazy">
            <div class="producer-info">
                <h3>${producer.name || 'Sin nombre'}</h3>
                <span class="category-badge ${producer.category ? producer.category.toLowerCase() : 'varios'}">${categoryName}</span>
                <p><strong>Producto:</strong> ${producer.product || 'Sin producto'}</p>
                <p><strong>Ubicación:</strong> ${producer.location || 'Sin ubicación'}</p>
                <p>${producer.description || 'Sin descripción'}</p>
                <a href="#" class="producer-whatsapp-btn whatsapp-btn" data-producer-id="${producer.id || ''}" data-whatsapp="${producer.whatsapp || ''}">
                    <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                </a>
            </div>
        `;
        producersList.appendChild(card);
    });

    document.querySelectorAll('.producer-whatsapp-btn').forEach(button => {
        const handleClick = (e) => {
            e.preventDefault();
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            const producerId = button.dataset.producerId;
            const whatsappNumber = button.dataset.whatsapp;
            trackClick(producerId, whatsappNumber);
        };
        button.addEventListener('click', handleClick);
        button.addEventListener('touchstart', handleClick, { passive: true });
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

        const handleCategoryClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }

            console.log(`Botón de categoría clickeado: ${category}`);

            stopGlowAnimation();
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = category;
            console.log(`Categoría actual cambiada a: ${currentCategory}`);
            loadProducers(document.getElementById('search-input').value, currentCategory);
            categoryMenu.setAttribute('aria-expanded', 'false');
            mainButton.querySelector('i').outerHTML = categoryIcons[currentCategory];
            const updatedMainLabel = mainButton.querySelector('.category-label');
            updatedMainLabel.innerHTML = createCategorySvg(currentCategory, categoryLabels[currentCategory]);
        };

        // Asegurarse de que los eventos no se dupliquen
        button.removeEventListener('click', handleCategoryClick);
        button.removeEventListener('touchstart', handleCategoryClick);
        button.addEventListener('click', handleCategoryClick);
        button.addEventListener('touchstart', handleCategoryClick, { passive: true });

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

    const handleMainButtonClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        const isOpen = categoryMenu.getAttribute('aria-expanded') === 'true';

        document.querySelectorAll('.category-menu[aria-expanded="true"]').forEach(menu => {
            menu.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
            categoryMenu.setAttribute('aria-expanded', 'true');
            startGlowAnimation();
        } else {
            stopGlowAnimation();
        }
    };

    mainButton.removeEventListener('click', handleMainButtonClick);
    mainButton.removeEventListener('touchstart', handleMainButtonClick);
    mainButton.addEventListener('click', handleMainButtonClick);
    mainButton.addEventListener('touchstart', handleMainButtonClick, { passive: true });

    document.addEventListener('click', (e) => {
        if (!categoryMenu.contains(e.target) && !mainButton.contains(e.target)) {
            categoryMenu.setAttribute('aria-expanded', 'false');
            stopGlowAnimation();
        }
    });

    document.addEventListener('touchstart', (e) => {
        if (!categoryMenu.contains(e.target) && !mainButton.contains(e.target)) {
            categoryMenu.setAttribute('aria-expanded', 'false');
            stopGlowAnimation();
        }
    }, { passive: true });
}

function setupModal() {
    const modal = document.getElementById('modal');
    const addBtn = document.getElementById('add-btn');
    const closeBtn = document.querySelector('.close');

    const openModal = (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
    };

    addBtn.addEventListener('click', openModal);
    addBtn.addEventListener('touchstart', openModal, { passive: true });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    closeBtn.addEventListener('touchstart', () => {
        modal.style.display = 'none';
    }, { passive: true });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    window.addEventListener('touchstart', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    }, { passive: true });
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

        const whatsappInput = form.querySelector('input[name="whatsapp"]');
        const whatsappValue = whatsappInput.value.replace(/[^0-9]/g, '');
        if (whatsappValue.length !== 10) {
            formMessage.textContent = 'El número de WhatsApp debe tener exactamente 10 dígitos (ej. 3227994023).';
            return;
        }
        whatsappInput.value = whatsappValue;

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

    const handleToggle = (e) => {
        e.preventDefault();
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    toggle.addEventListener('click', handleToggle);
    toggle.addEventListener('touchstart', handleToggle, { passive: true });
}

function setupFooterWhatsApp() {
    const footerWhatsappBtn = document.getElementById('footer-whatsapp-btn');
    if (footerWhatsappBtn) {
        const handleFooterClick = (e) => {
            e.preventDefault();
            const whatsappNumber = '573227994023';
            const message = encodeURIComponent('Hola, quiero información sobre Putumayo Conecta');
            const whatsappUrl = `https://wa.me/+${whatsappNumber}?text=${message}`;
            console.log('Enlace de WhatsApp del footer:', whatsappUrl);

            const newWindow = window.open(whatsappUrl, '_blank');
            setTimeout(() => {
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    alert('Parece que WhatsApp no está instalado. Por favor, instala WhatsApp o contacta manualmente al número: +573227994023');
                }
            }, 1000);
        };

        footerWhatsappBtn.removeEventListener('click', handleFooterClick);
        footerWhatsappBtn.removeEventListener('touchstart', handleFooterClick);
        footerWhatsappBtn.addEventListener('click', handleFooterClick);
        footerWhatsappBtn.addEventListener('touchstart', handleFooterClick, { passive: true });
    }
}

function init() {
    setupSearch();
    setupCategoryButtons();
    setupModal();
    setupForm();
    setupDarkMode();
    setupFooterWhatsApp();
    loadProducers();
}

document.addEventListener('DOMContentLoaded', init);