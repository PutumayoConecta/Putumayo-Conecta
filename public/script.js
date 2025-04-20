// Show loading spinner
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Fetch data from producers.json
async function fetchData() {
    try {
        showLoading(true);
        const res = await fetch('/producers.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Error fetching producers.json: ${res.status}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Retorna un array vacío como fallback
    } finally {
        showLoading(false);
    }
}

// Track click on WhatsApp link
async function trackClick(producerId, whatsappUrl) {
    try {
        await fetch('/api/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producerId: producerId.toString() })
        });
        window.open(whatsappUrl, '_blank');
    } catch (error) {
        console.error('Error tracking click:', error);
        window.open(whatsappUrl, '_blank');
    }
}

// Load producers with optional filters
async function loadProducers(filter = "all", searchQuery = "") {
    const producersList = document.getElementById('producers-list');
    producersList.innerHTML = '';
    
    let producers = await fetchData();
    
    // Apply category filter
    let filteredProducers = filter === "all" 
        ? producers 
        : producers.filter(producer => producer.category.toLowerCase() === filter.toLowerCase());
    
    // Debug: Log filtered producers
    console.log(`Filtro: ${filter}, Productores encontrados:`, filteredProducers);
    
    // Apply search filter
    if (searchQuery) {
        searchQuery = searchQuery.toLowerCase();
        filteredProducers = filteredProducers.filter(producer =>
            producer.name.toLowerCase().includes(searchQuery) ||
            producer.product.toLowerCase().includes(searchQuery)
        );
    }
    
    // Update counter
    document.getElementById('counter').textContent = 
        `${filteredProducers.length} emprendimientos ${filter === "all" ? "" : "de " + filter.charAt(0).toUpperCase() + filter.slice(1)}${searchQuery ? " (búsqueda)" : ""}`;
    
    // Generate cards with animation delay
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
                <a href="#" class="whatsapp-btn" data-producer-id="${producer.id}" data-whatsapp="https://wa.me/${producer.whatsapp}">
                    <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                </a>
            </div>
        `;
        producersList.appendChild(card);
    });

    // Add click listeners to WhatsApp buttons
    document.querySelectorAll('.whatsapp-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const producerId = button.dataset.producerId;
            const whatsappUrl = button.dataset.whatsapp;
            trackClick(producerId, whatsappUrl);
        });
    });
}

// Initialize filters
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadProducers(button.dataset.filter, document.getElementById('search-input').value);
        });
    });
}

// Setup search
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        loadProducers(activeFilter, searchInput.value);
    });
}

// Setup modal
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

// Handle form submission
function setupForm() {
    const form = document.getElementById('register-form');
    const formMessage = document.getElementById('form-message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validar que se haya seleccionado una imagen
        const imageInput = form.querySelector('input[name="image"]');
        if (!imageInput.files || imageInput.files.length === 0) {
            formMessage.textContent = 'Por favor, selecciona una imagen para tu emprendimiento.';
            return;
        }

        formMessage.textContent = 'Enviando...';
        
        const formData = new FormData(form);
        const producerId = Date.now().toString();
        formData.append('producerId', producerId); // Añade producerId al FormData

        try {
            // Registrar usuario y emprendimiento en una sola solicitud
            const response = await fetch('/api/register-user', {
                method: 'POST',
                body: formData // Envía FormData directamente, incluyendo la imagen
            });
            
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al registrar el emprendimiento');
            }

            formMessage.textContent = '¡Emprendimiento y usuario registrados con éxito!';

            // Preguntar si desea guardar las credenciales
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

// Dark mode toggle
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

// Initialize app
function init() {
    setupFilters();
    setupSearch();
    setupModal();
    setupForm();
    setupDarkMode();
    loadProducers();
}

init();