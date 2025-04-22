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

   let currentCategory = 'all'; // Variable para rastrear la categoría seleccionada

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
               producer.category.toLowerCase() === 'agroindustria' ? 'Agroindustria' :
               producer.category.toLowerCase() === 'gastronomia' ? 'Gastronomía' :
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

   function setupSearch() {
       const searchInput = document.getElementById('search-input');
       searchInput.addEventListener('input', () => {
           loadProducers(searchInput.value, currentCategory);
       });
   }

   function setupCategoryButtons() {
       const buttons = document.querySelectorAll('.category-btn');
       buttons.forEach(button => {
           button.addEventListener('click', () => {
               // Remover la clase 'active' de todos los botones
               buttons.forEach(btn => btn.classList.remove('active'));
               // Añadir la clase 'active' al botón seleccionado
               button.classList.add('active');
               // Actualizar la categoría seleccionada
               currentCategory = button.dataset.category;
               // Recargar los productores con la nueva categoría
               loadProducers(document.getElementById('search-input').value, currentCategory);
           });
       });
       // Establecer el botón "Todos" como activo por defecto
       document.querySelector('.category-btn[data-category="all"]').classList.add('active');
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