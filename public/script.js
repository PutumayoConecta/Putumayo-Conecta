function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
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
    // Registrar el clic en el backend (fire-and-forget, no esperamos la respuesta)
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
        if (!whatsappNumber) {
            throw new Error('Falta dato: whatsappNumber no está definido');
        }
        
        // Limpiar el número de WhatsApp (eliminar cualquier carácter que no sea número o el +)
        const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '');
        
        // Verificar que el número tenga el formato correcto (+57 + 10 dígitos o solo 10 dígitos)
        if (!cleanNumber.match(/^\+57[0-9]{10}$/) && !/^[0-9]{10}$/.test(cleanNumber)) {
            throw new Error('El número de WhatsApp debe empezar con +57 y tener 10 dígitos después (ej. +573227994023) o ser solo 10 dígitos (ej. 3227994023)');
        }
        
        // Ajustar el número si solo tiene 10 dígitos (agregar +57)
        let whatsappUrlNumber = cleanNumber;
        if (/^[0-9]{10}$/.test(cleanNumber)) {
            whatsappUrlNumber = `+57${cleanNumber}`;
        }
        
        // Mensaje predefinido
        const message = encodeURIComponent('Hola, quiero información sobre Putumayo Conecta');
        const whatsappUrl = `https://wa.me/${whatsappUrlNumber}?text=${message}`;
        
        // Intentar abrir WhatsApp directamente (específico para Android)
        const androidIntent = `whatsapp://send?phone=${whatsappUrlNumber}&text=${message}`;
        window.location.href = androidIntent;
        
        // Si falla (WhatsApp no instalado), caerá al catch y usaremos la URL web
        setTimeout(() => {
            window.location.href = whatsappUrl; // Fallback a la URL web si el intent falla
        }, 1000); // Pequeño retraso para dar tiempo al intent

    } catch (error) {
        console.error('Error al abrir WhatsApp:', error);
        alert('WhatsApp no está instalado en tu dispositivo. Puedes descargarlo desde la tienda de aplicaciones o contactarnos por otro medio.');
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

function setupModalAndForm() {
    const modal = document.getElementById('modal');
    const addBtn = document.getElementById('add-btn');
    const closeBtn = document.querySelector('.close');
    const registerForm = document.getElementById('register-form');
    const formMessage = document.getElementById('form-message');
    const loading = document.getElementById('loading');

    // Mostrar modal
    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });

    // Cerrar modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        registerForm.reset();
        formMessage.textContent = '';
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            registerForm.reset();
            formMessage.textContent = '';
        }
    });

    // Validación y envío del formulario
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formMessage.textContent = '';
        const whatsapp = document.getElementById('whatsapp').value.trim();
        const imageInput = document.querySelector('input[name="image"]');

        // Validación de número de WhatsApp
        if (!/^\d{10}$/.test(whatsapp)) {
            formMessage.textContent = '❌ El número de WhatsApp debe tener exactamente 10 dígitos.';
            formMessage.style.color = 'red';
            return;
        }

        // Validación de imagen
        if (!imageInput.files || imageInput.files.length === 0) {
            formMessage.textContent = '❌ Por favor, selecciona una imagen para tu emprendimiento.';
            formMessage.style.color = 'red';
            return;
        }

        // Mostrar spinner de carga
        showLoading(true);

        try {
            const formData = new FormData(registerForm);
            const producerId = Date.now().toString();
            formData.append('producerId', producerId);

            const response = await fetch('/api/register-user', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Error en el servidor');

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Error al registrar el emprendimiento');

            formMessage.textContent = '✅ ¡Registro exitoso!';
            formMessage.style.color = 'green';
            registerForm.reset();

            // Guardar credenciales si el usuario lo desea
            const email = formData.get('email');
            const password = formData.get('password');
            const saveCredentials = confirm('¿Deseas guardar tu usuario y contraseña para futuros ingresos?');
            if (saveCredentials) {
                localStorage.setItem('savedEmail', email);
                localStorage.setItem('savedPassword', password);
            }

            // Recargar productores después del registro
            setTimeout(async () => {
                modal.style.display = 'none';
                formMessage.textContent = '';
                await loadProducers(document.getElementById('search-input').value, currentCategory);
            }, 2000);
        } catch (error) {
            formMessage.textContent = '❌ Hubo un error al registrar. Inténtalo más tarde.';
            formMessage.style.color = 'red';
            console.error('Error:', error);
        } finally {
            showLoading(false);
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
    setupModalAndForm();
    setupDarkMode();
    loadProducers();
    
    // Manejar clics en enlaces WhatsApp del footer
    const footerWhatsappBtn = document.querySelector('footer .whatsapp-btn');
    if (footerWhatsappBtn) {
        footerWhatsappBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const whatsappNumber = this.dataset.whatsapp || '3227994023';
            trackClick('', whatsappNumber);
        });
    }
}

document.addEventListener('DOMContentLoaded', init);