document.addEventListener('DOMContentLoaded', () => {
    let currentCategory = 'all';
    let glowAnimationRunning = false;
    let glowInterval = null;
    const BASE_URL = 'https://putumayoconecta.com'; // Configura tu URL real aquí (e.g., http://localhost:3000 para pruebas locales)

    function showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }

    async function fetchData() {
        try {
            showLoading(true);
            const res = await fetch('/api/producers', { cache: 'no-store' });
            if (!res.ok) throw new Error(`Error fetching producers: ${res.status} - ${await res.text()}`);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        } finally {
            showLoading(false);
        }
    }

    function openWhatsApp(number, message = "Hola, vi tu emprendimiento en Putumayo Conecta") {
        const cleanNumber = number.toString().replace(/[^0-9]/g, '');
        const finalNumber = cleanNumber.length === 10 ? `+57${cleanNumber}` : `+${cleanNumber}`;
        const url = `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    function setupWhatsAppButtons() {
        const footerWhatsappBtn = document.getElementById('footer-whatsapp-btn');
        if (footerWhatsappBtn) {
            footerWhatsappBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (navigator.vibrate) navigator.vibrate(50);
                openWhatsApp(e.target.dataset.whatsapp || '3227994023');
            });
        }

        document.addEventListener('click', (e) => {
            const button = e.target.closest('.producer-whatsapp-btn');
            if (button) {
                e.preventDefault();
                if (navigator.vibrate) navigator.vibrate(50);
                openWhatsApp(button.dataset.whatsapp);
            }
        });
    }

    const shareOptions = {
        whatsapp: {
            id: 'whatsapp-share',
            icon: 'fab fa-whatsapp',
            action: () => {
                const modal = document.getElementById('share-modal');
                const producerId = modal.dataset.producerId;
                const title = document.getElementById('share-title').textContent;
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ¡Conoce este emprendimiento en Putumayo Conecta! ${title} 🚀 ${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }
        },
        facebook: {
            id: 'facebook-share',
            icon: 'fab fa-facebook',
            action: () => {
                const modal = document.getElementById('share-modal');
                const producerId = modal.dataset.producerId;
                const title = document.getElementById('share-title').textContent;
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ¡Conoce este emprendimiento en Putumayo Conecta! ${title} 🚀 ${url}`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`, '_blank');
            }
        },
        twitter: {
            id: 'twitter-share',
            icon: 'fab fa-x-twitter',
            action: () => {
                const modal = document.getElementById('share-modal');
                const producerId = modal.dataset.producerId;
                const title = document.getElementById('share-title').textContent;
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ¡Conoce este emprendimiento en Putumayo Conecta! ${title} 🚀 ${url}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
            }
        },
        tiktok: {
            id: 'tiktok-share',
            icon: 'fab fa-tiktok',
            action: async () => {
                const modal = document.getElementById('share-modal');
                const producerId = modal.dataset.producerId;
                const title = document.getElementById('share-title').textContent;
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ¡Conoce este emprendimiento en Putumayo Conecta! ${title} 🚀 ${url}`;
                try {
                    if (navigator.clipboard) {
                        await navigator.clipboard.writeText(message);
                        alert('Mensaje copiado. Pégalo en tu publicación de TikTok.');
                    } else {
                        const textarea = document.createElement('textarea');
                        textarea.value = message;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        alert('Mensaje copiado. Pégalo en tu publicación de TikTok.');
                    }
                } catch (err) {
                    console.error('Error copying to clipboard:', err);
                    alert('Error al copiar. Copia manualmente: ' + message);
                }
            }
        },
        instagram: {
            id: 'instagram-share',
            icon: 'fab fa-instagram',
            action: async () => {
                const modal = document.getElementById('share-modal');
                const producerId = modal.dataset.producerId;
                const title = document.getElementById('share-title').textContent;
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ¡Conoce este emprendimiento en Putumayo Conecta! ${title} 🚀 ${url}`;
                try {
                    if (navigator.clipboard) {
                        await navigator.clipboard.writeText(message);
                        alert('Mensaje copiado. Pégalo en tu publicación de Instagram.');
                    } else {
                        const textarea = document.createElement('textarea');
                        textarea.value = message;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        alert('Mensaje copiado. Pégalo en tu publicación de Instagram.');
                    }
                } catch (err) {
                    console.error('Error copying to clipboard:', err);
                    alert('Error al copiar. Copia manualmente: ' + message);
                }
            }
        }
    };

    function setupShareButtons() {
        const shareModalHTML = `
            <div class="share-modal" id="share-modal" role="dialog" aria-modal="true" aria-label="Compartir emprendimiento">
                <div class="share-modal-content">
                    <h3>Compartir emprendimiento</h3>
                    <p id="share-title"></p>
                    <div class="share-options">
                        ${Object.values(shareOptions).map(option => `
                            <div class="share-option" id="${option.id}">
                                <i class="${option.icon}"></i>
                            </div>
                        `).join('')}
                    </div>
                    <button id="close-share-modal" class="close-share-btn">Cerrar</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', shareModalHTML);

        const modal = document.getElementById('share-modal');
        Object.values(shareOptions).forEach(option => {
            document.getElementById(option.id)?.addEventListener('click', () => {
                option.action();
                closeShareModal();
            });
        });

        document.getElementById('close-share-modal').addEventListener('click', closeShareModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeShareModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeShareModal();
            }
        });

        document.getElementById('producers-list').addEventListener('click', (e) => {
            const shareBtn = e.target.closest('.share-btn');
            if (shareBtn) {
                e.preventDefault();
                const { producerId, name, product } = shareBtn.dataset;
                if (!producerId || !name || !product) {
                    console.error('Datos de emprendimiento incompletos:', { producerId, name, product });
                    alert('Error: No se pueden compartir los datos de este emprendimiento.');
                    return;
                }
                openShareModal(producerId, name, product);
            }
        });
    }

    function openShareModal(producerId, name, product) {
        const modal = document.getElementById('share-modal');
        const title = document.getElementById('share-title');
        title.textContent = `${name} - ${product}`;
        modal.dataset.producerId = producerId;
        modal.style.display = 'flex';
        modal.classList.add('open');
        document.getElementById('close-share-modal').focus();
    }

    function closeShareModal() {
        const modal = document.getElementById('share-modal');
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

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
                    <div class="producer-actions">
                        <a href="#" class="producer-whatsapp-btn whatsapp-btn" data-producer-id="${producer.id}" data-whatsapp="${producer.whatsapp}">
                            <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                        </a>
                        <button class="share-btn" data-producer-id="${producer.id}" data-name="${producer.name}" data-product="${producer.product}">
                            <i class="fas fa-share-nodes"></i> Compartir
                        </button>
                    </div>
                </div>
            `;
            producersList.appendChild(card);
        });

        setupWhatsAppButtons();
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
                if (navigator.vibrate) navigator.vibrate(50);
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
            if (navigator.vibrate) navigator.vibrate(50);
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

        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            registerForm.reset();
            formMessage.textContent = '';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                registerForm.reset();
                formMessage.textContent = '';
            }
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            formMessage.textContent = '';
            const whatsapp = document.getElementById('whatsapp').value.trim();
            const imageInput = document.querySelector('input[name="image"]');

            if (!/^\d{10}$/.test(whatsapp)) {
                formMessage.textContent = '❌ El número de WhatsApp debe tener exactamente 10 dígitos.';
                formMessage.style.color = 'red';
                return;
            }

            if (!imageInput.files || imageInput.files.length === 0) {
                formMessage.textContent = '❌ Por favor, selecciona una imagen para tu emprendimiento.';
                formMessage.style.color = 'red';
                return;
            }

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

                const email = formData.get('email');
                const password = formData.get('password');
                const saveCredentials = confirm('¿Deseas guardar tu usuario y contraseña para futuros ingresos?');
                if (saveCredentials) {
                    localStorage.setItem('savedEmail', email);
                    localStorage.setItem('savedPassword', password);
                }

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
        setupWhatsAppButtons();
        setupShareButtons();
        loadProducers();
    }

    init();
});