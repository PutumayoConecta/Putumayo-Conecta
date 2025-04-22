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

async function trackClick(producerId, whatsappUrl) {
    try {
        if (!producerId || !whatsappUrl) {
            throw new Error('Faltan datos: producerId o whatsappUrl no están definidos');
        }
        await fetch('/api/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producerId: producerId.toString() })
        });
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error tracking click:', error);
        if (whatsappUrl) {
            window.open(whatsappUrl, '_blank');
        }
    }
}

async function loadProducers(filter = "all", searchQuery = "") {
    const producersList = document.getElementById('producers-list');
    producersList.innerHTML = '';
    
    let producers = await fetchData();
    
    console.log('Productores antes de filtrar:', producers);
    
    let filteredProducers = filter === "all" 
        ? producers 
        : producers.filter(producer => producer.category.toLowerCase() === filter.toLowerCase());
    
    console.log(`Filtro: ${filter}, Productores encontrados:`, filteredProducers);
    
    if (searchQuery) {
        searchQuery = searchQuery.toLowerCase();
        filteredProducers = filteredProducers.filter(producer =>
            producer.name.toLowerCase().includes(searchQuery) ||
            producer.product.toLowerCase().includes(searchQuery)
        );
    }
    
    document.getElementById('counter').textContent = 
        `${filteredProducers.length} emprendimientos ${filter === "all" ? "" : "de " + filter.charAt(0).toUpperCase() + filter.slice(1)}${searchQuery ? " (búsqueda)" : ""}`;
    
    filteredProducers.forEach((producer, index) => {
        const badgeClass = `${producer.category.toLowerCase()}-badge`;
        const categoryName = 
            producer.category.toLowerCase() === 'agricultura' ? 'Agricultura' : 
            producer.category.toLowerCase() === 'artesania' ? 'Artesanía' : 
            producer.category.toLowerCase() === 'turismo' ? 'Turismo' :
            producer.category.toLowerCase() === 'agroindustria' ? 'Agroindustria' :
            'Varios';
        
        const card = document.createElement('div');
        card.className = 'producer-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <img src="${producer.image}" alt="${producer.product}" loading="lazy">
            <div class="producer-info">
                <h3>${producer.name}</h3>
                <span class="category-badge ${badgeClass}">${categoryName}</span>
                <p><strong>Producto:</strong> ${producer.product}</p>
                <p><strong>Ubicación:</strong> ${producer.location}</p>
                <p>${producer.description}</p>
                <a href="#" class="producer-whatsapp-btn whatsapp-btn" data-producer-id="${producer.id}" data-whatsapp="https://wa.me/${producer.whatsapp}">
                    <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                </a>
            </div>
        `;
        producersList.appendChild(card);
    });

    document.querySelectorAll('.producer-whatsapp-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const producerId = button.dataset.producerId;
            const whatsappUrl = button.dataset.whatsapp;
            trackClick(producerId, whatsappUrl);
        });
    });
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadProducers(button.dataset.filter, document.getElementById('search-input').value);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        loadProducers(activeFilter, searchInput.value);
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
                loadProducers(
                    document.querySelector('.filter-btn.active').dataset.filter,
                    document.getElementById('search-input').value
                );
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
    setupFilters();
    setupSearch();
    setupModal();
    setupForm();
    setupDarkMode();
    loadProducers();
}

init();