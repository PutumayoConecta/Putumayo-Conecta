function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

async function fetchData() {
    try {
        showLoading(true);
        const res = await fetch('https://putumayo-conecta.onrender.com/api/producers', { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Error: ${res.status} - ${await res.text()}`);
        }
        const data = await res.json();
        console.log('Datos recibidos:', data);
        return data;
    } catch (error) {
        console.error('Error al conectar:', error);
        document.getElementById('producers-list').innerHTML = `<p>Error: ${error.message}</p>`;
        return [];
    } finally {
        showLoading(false);
    }
}

function openWhatsApp(whatsappNumber, messageText) {
    try {
        if (!whatsappNumber) {
            throw new Error('Número de WhatsApp no definido');
        }

        let cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length === 10) {
            cleanNumber = `57${cleanNumber}`;
        } else if (cleanNumber.length !== 12 || !cleanNumber.startsWith('57')) {
            throw new Error('El número de WhatsApp debe tener 10 dígitos (ej. 3227994023)');
        }

        const message = encodeURIComponent(messageText);
        const whatsappUrl = `https://wa.me/+${cleanNumber}?text=${message}`;
        window.location.href = whatsappUrl;
    } catch (error) {
        console.error('Error al abrir WhatsApp:', error);
        alert('No se pudo abrir WhatsApp. Asegúrate de que el número sea correcto (ej. 3227994023).');
    }
}

async function trackClick(producerId, whatsappNumber) {
    if (producerId) {
        try {
            await fetch('https://putumayo-conecta.onrender.com/api/track-click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ producerId: producerId.toString() })
            });
        } catch (error) {
            console.error('Error al registrar clic:', error);
        }
    }
    openWhatsApp(whatsappNumber, 'Hola, estoy interesado en tu emprendimiento en Putumayo Conecta');
}

let currentCategory = 'all';

async function loadProducers(searchQuery = "", category = currentCategory) {
    const producersList = document.getElementById('producers-list');
    const countElement = document.getElementById('count');
    if (!producersList || !countElement) {
        console.error('Elementos no encontrados');
        return;
    }

    producersList.innerHTML = '<p>Cargando...</p>';
    const producers = await fetchData();

    let filteredProducers = producers;

    if (searchQuery) {
        searchQuery = searchQuery.toLowerCase();
        filteredProducers = filteredProducers.filter(producer =>
            (producer.name && producer.name.toLowerCase().includes(searchQuery)) ||
            (producer.product && producer.product.toLowerCase().includes(searchQuery))
        );
    }

    if (category !== 'all') {
        filteredProducers = filteredProducers.filter(producer =>
            producer.category && producer.category.toLowerCase() === category.toLowerCase()
        );
    }

    countElement.textContent = filteredProducers.length;
    producersList.innerHTML = '';

    if (filteredProducers.length === 0) {
        producersList.innerHTML = '<p>No se encontraron emprendimientos.</p>';
        return;
    }

    filteredProducers.forEach((producer, index) => {
        const card = document.createElement('div');
        card.className = 'producer-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <img src="${producer.image || '/images/logo.png'}" alt="${producer.product || 'Producto'}" loading="lazy">
            <div class="producer-info">
                <h3>${producer.name || 'Sin nombre'}</h3>
                <span class="category-badge ${producer.category ? producer.category.toLowerCase() : 'varios'}">${producer.category || 'Varios'}</span>
                <p><strong>Producto:</strong> ${producer.product || 'Sin producto'}</p>
                <p><strong>Ubicación:</strong> ${producer.location || 'Sin ubicación'}</p>
                <p>${producer.description || 'Sin descripción'}</p>
                <a href="#" class="whatsapp-btn" data-producer-id="${producer.id || ''}" data-whatsapp="${producer.whatsapp || ''}">
                    <i class="fab fa-whatsapp"></i> Contactar
                </a>
            </div>
        `;
        producersList.appendChild(card);
    });

    document.querySelectorAll('.whatsapp-btn').forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault();
            const producerId = button.dataset.producerId;
            const whatsappNumber = button.dataset.whatsapp;
            trackClick(producerId, whatsappNumber);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadProducers(searchInput.value, currentCategory);
        }, 300);
    });
}

function setupCategoryButtons() {
    const mainButton = document.querySelector('.category-btn.main-btn');
    const categoryMenu = document.querySelector('.category-menu');
    const subButtons = document.querySelectorAll('.category-btn.sub-btn');

    if (!mainButton || !categoryMenu || !subButtons.length) return;

    mainButton.addEventListener('click', e => {
        e.preventDefault();
        const isOpen = categoryMenu.classList.contains('open');
        categoryMenu.classList.toggle('open', !isOpen);
        categoryMenu.setAttribute('aria-expanded', !isOpen);
    });

    subButtons.forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault();
            subButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            categoryMenu.classList.remove('open');
            categoryMenu.setAttribute('aria-expanded', 'false');
            loadProducers(document.getElementById('search-input').value, currentCategory);
            mainButton.querySelector('i').className = button.querySelector('i').className;
            mainButton.querySelector('.category-label').textContent = button.querySelector('.category-label').textContent;
        });
    });

    document.addEventListener('click', e => {
        if (!categoryMenu.contains(e.target) && !mainButton.contains(e.target)) {
            categoryMenu.classList.remove('open');
            categoryMenu.setAttribute('aria-expanded', 'false');
        }
    });
}

function setupModal() {
    const modal = document.getElementById('modal');
    const addBtn = document.getElementById('add-btn');
    const closeBtn = document.querySelector('.close');

    if (!modal || !addBtn || !closeBtn) return;

    addBtn.addEventListener('click', e => {
        e.preventDefault();
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', e => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function setupForm() {
    const form = document.getElementById('register-form');
    const formMessage = document.getElementById('form-message');

    if (!form || !formMessage) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const imageInput = form.querySelector('input[name="image"]');
        if (!imageInput.files || imageInput.files.length === 0) {
            formMessage.textContent = 'Por favor, selecciona una imagen del producto/servicio.';
            return;
        }

        const whatsappInput = form.querySelector('input[name="whatsapp"]');
        const whatsappValue = whatsappInput.value.replace(/[^0-9]/g, '');
        if (whatsappValue.length !== 10) {
            formMessage.textContent = 'El número de WhatsApp debe tener 10 dígitos (ej. 3227994023).';
            return;
        }
        whatsappInput.value = whatsappValue;

        formMessage.textContent = 'Enviando...';

        const formData = new FormData(form);
        const producerId = Date.now().toString();
        formData.append('producerId', producerId);

        try {
            const response = await fetch('https://putumayo-conecta.onrender.com/api/register-user', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al registrar');
            }

            formMessage.textContent = '¡Registro exitoso!';
            formMessage.style.color = '#2ECC71';
            form.reset();
            setTimeout(() => {
                modal.style.display = 'none';
                formMessage.textContent = '';
                loadProducers(document.getElementById('search-input').value, currentCategory);
            }, 2000);
        } catch (error) {
            formMessage.textContent = error.message || 'Error al registrar. Intenta de nuevo.';
            formMessage.style.color = '#E74C3C';
        }
    });
}

function setupDarkMode() {
    const toggle = document.getElementById('theme-toggle');
    const body = document.body;

    if (!toggle || !body) return;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    toggle.addEventListener('click', e => {
        e.preventDefault();
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

function setupFooterWhatsApp() {
    const footerWhatsappBtn = document.getElementById('footer-whatsapp-btn');
    if (!footerWhatsappBtn) return;

    footerWhatsappBtn.addEventListener('click', e => {
        e.preventDefault();
        openWhatsApp('573227994023', 'Hola, quiero información sobre Putumayo Conecta');
    });
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