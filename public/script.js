document.addEventListener('DOMContentLoaded', () => {
    let currentCategory = 'all';
    let glowAnimationRunning = false;
    let glowInterval = null;
    const BASE_URL = 'https://putumayoconecta.com';
    let currentLang = localStorage.getItem('language') || 'es';
    let searchQuery = '';

    // Translations
    const translations = {
        es: {
            headerTitle: '🤝🌴 Putumayo Conecta ♻️🌎',
            headerSubtitle: 'Con Productores, Artesanos y Emprendedores Turísticos de la Amazonía Colombiana',
            searchPlaceholder: 'Busca emprendimientos por nombre o producto...',
            producersCount: 'Emprendimientos',
            categoryAll: 'Todos',
            categoryAgricultura: 'Agricultura',
            categoryAgroindustria: 'Agroindustria',
            categoryArtesania: 'Artesanía',
            categoryGastronomia: 'Gastronomía',
            categoryTurismo: 'Turismo',
            categoryVarios: 'Varios',
            registerPrompt: '¿Eres Emprendedor? ',
            registerLink: '¡Regístrate aquí!',
            developerNote: 'Para desarrollo de software, contactar con Putumayo Conecta',
            developerName: 'Jose Alexis Tejada Angulo - Ingeniero Industrial',
            modalTitle: '¡Registra tu Emprendimiento!',
            emailLabel: 'Correo Electrónico *',
            emailPlaceholder: 'ejemplo@correo.com',
            passwordLabel: 'Contraseña *',
            passwordPlaceholder: 'Mínimo 6 caracteres',
            nameLabel: 'Nombre del Emprendimiento *',
            namePlaceholder: 'Ej. Miel del Putumayo',
            categoryLabel: 'Categoría *',
            categoryPlaceholder: 'Selecciona una categoría',
            productLabel: 'Producto o Servicio *',
            productPlaceholder: 'Ej. Miel orgánica',
            descriptionLabel: 'Descripción *',
            descriptionPlaceholder: 'Describe tu emprendimiento',
            locationLabel: 'Ubicación *',
            locationPlaceholder: 'Ej. Mocoa, Putumayo',
            whatsappLabel: 'WhatsApp (solo 10 dígitos, ej. 3227994023) *',
            whatsappPlaceholder: 'Ej. 3227994023',
            whatsappTitle: 'El número debe tener exactamente 10 dígitos (ej. 3227994023)',
            imageLabel: 'Imagen del Emprendimiento *',
            submitButton: 'Registrar',
            shareTitle: 'Compartir emprendimiento',
            closeShareButton: 'Cerrar',
            errorWhatsapp: '❌ El número de WhatsApp debe tener exactamente 10 dígitos.',
            errorImage: '❌ Por favor, selecciona una imagen para tu emprendimiento.',
            successMessage: '✅ ¡Registro exitoso!',
            errorMessage: '❌ Hubo un error al registrar. Inténtalo más tarde.',
            saveCredentialsPrompt: '¿Deseas guardar tu usuario y contraseña para futuros ingresos?',
            noProducers: 'No se encontraron emprendimientos.',
            loadingProducers: 'Cargando productores...',
            contactWhatsApp: 'Contactar por WhatsApp',
            shareButton: 'Compartir',
            languageLabel: 'Idioma'
        },
        en: {
            headerTitle: '🤝🌴 Putumayo Connects ♻️🌎',
            headerSubtitle: 'With Producers, Artisans, and Tourism Entrepreneurs of the Colombian Amazon',
            searchPlaceholder: 'Search for ventures by name or product...',
            producersCount: 'Ventures',
            categoryAll: 'All',
            categoryAgricultura: 'Agriculture',
            categoryAgroindustria: 'Agroindustry',
            categoryArtesania: 'Handicrafts',
            categoryGastronomia: 'Gastronomy',
            categoryTurismo: 'Tourism',
            categoryVarios: 'Various',
            registerPrompt: 'Are you an Entrepreneur? ',
            registerLink: 'Register here!',
            developerNote: 'For software development, contact Putumayo Conecta',
            developerName: 'Jose Alexis Tejada Angulo - Industrial Engineer',
            modalTitle: 'Register Your Venture!',
            emailLabel: 'Email *',
            emailPlaceholder: 'example@email.com',
            passwordLabel: 'Password *',
            passwordPlaceholder: 'Minimum 6 characters',
            nameLabel: 'Venture Name *',
            namePlaceholder: 'E.g. Putumayo Honey',
            categoryLabel: 'Category *',
            categoryPlaceholder: 'Select a category',
            productLabel: 'Product or Service *',
            productPlaceholder: 'E.g. Organic Honey',
            descriptionLabel: 'Description *',
            descriptionPlaceholder: 'Describe your venture',
            locationLabel: 'Location *',
            locationPlaceholder: 'E.g. Mocoa, Putumayo',
            whatsappLabel: 'WhatsApp (10 digits, e.g. 3227994023) *',
            whatsappPlaceholder: 'E.g. 3227994023',
            whatsappTitle: 'The number must have exactly 10 digits (e.g. 3227994023)',
            imageLabel: 'Venture Image *',
            submitButton: 'Register',
            shareTitle: 'Share Venture',
            closeShareButton: 'Close',
            errorWhatsapp: '❌ The WhatsApp number must have exactly 10 digits.',
            errorImage: '❌ Please select an image for your venture.',
            successMessage: '✅ Registration successful!',
            errorMessage: '❌ There was an error registering. Please try again later.',
            saveCredentialsPrompt: 'Do you want to save your username and password for future logins?',
            noProducers: 'No ventures found.',
            loadingProducers: 'Loading ventures...',
            contactWhatsApp: 'Contact via WhatsApp',
            shareButton: 'Share',
            languageLabel: 'Language'
        },
        pt: {
            headerTitle: '🤝🌴 Putumayo Conecta ♻️🌎',
            headerSubtitle: 'Com Produtores, Artesãos e Empreendedores Turísticos da Amazônia Colombiana',
            searchPlaceholder: 'Pesquise empreendimentos por nome ou produto...',
            producersCount: 'Empreendimentos',
            categoryAll: 'Todos',
            categoryAgricultura: 'Agricultura',
            categoryAgroindustria: 'Agroindústria',
            categoryArtesania: 'Artesanato',
            categoryGastronomia: 'Gastronomia',
            categoryTurismo: 'Turismo',
            categoryVarios: 'Vários',
            registerPrompt: 'É empreendedor? ',
            registerLink: 'Registre-se aqui!',
            developerNote: 'Para desenvolvimento de software, contate Putumayo Conecta',
            developerName: 'Jose Alexis Tejada Angulo - Engenheiro Industrial',
            modalTitle: 'Registre seu Empreendimento!',
            emailLabel: 'E-mail *',
            emailPlaceholder: 'exemplo@correio.com',
            passwordLabel: 'Senha *',
            passwordPlaceholder: 'Mínimo 6 caracteres',
            nameLabel: 'Nome do Empreendimento *',
            namePlaceholder: 'Ex. Mel do Putumayo',
            categoryLabel: 'Categoria *',
            categoryPlaceholder: 'Selecione uma categoria',
            productLabel: 'Produto ou Serviço *',
            productPlaceholder: 'Ex. Mel orgânico',
            descriptionLabel: 'Descrição *',
            descriptionPlaceholder: 'Descreva seu empreendimento',
            locationLabel: 'Localização *',
            locationPlaceholder: 'Ex. Mocoa, Putumayo',
            whatsappLabel: 'WhatsApp (10 dígitos, ex. 3227994023) *',
            whatsappPlaceholder: 'Ex. 3227994023',
            whatsappTitle: 'O número deve ter exatamente 10 dígitos (ex. 3227994023)',
            imageLabel: 'Imagem do Empreendimento *',
            submitButton: 'Registrar',
            shareTitle: 'Compartilhar empreendimento',
            closeShareButton: 'Fechar',
            errorWhatsapp: '❌ O número de WhatsApp deve ter exatamente 10 dígitos.',
            errorImage: '❌ Por favor, selecione uma imagem para seu empreendimento.',
            successMessage: '✅ Registro bem-sucedido!',
            errorMessage: '❌ Ocorreu um erro ao registrar. Tente novamente mais tarde.',
            saveCredentialsPrompt: 'Deseja salvar seu usuário e senha para futuros acessos?',
            noProducers: 'Nenhum empreendimento encontrado.',
            loadingProducers: 'Carregando empreendimentos...',
            contactWhatsApp: 'Contatar pelo WhatsApp',
            shareButton: 'Compartilhar',
            languageLabel: 'Idioma'
        },
        zh: {
            headerTitle: '🤝🌴 普图马约连接 ♻️🌎',
            headerSubtitle: '连接哥伦比亚亚马逊的种植者、手工艺者和旅游企业家',
            searchPlaceholder: '按名称或产品搜索创业项目...',
            producersCount: '创业项目',
            categoryAll: '全部',
            categoryAgricultura: '农业',
            categoryAgroindustria: '农业工业',
            categoryArtesania: '手工艺',
            categoryGastronomia: '美食',
            categoryTurismo: '旅游',
            categoryVarios: '其他',
            registerPrompt: '你是企业家吗？ ',
            registerLink: '在这里注册！',
            developerNote: '如需软件开发，请联系普图马约连接',
            developerName: '何塞·亚历克西斯·特哈达·安古洛 - 工业工程师',
            modalTitle: '注册您的创业项目！',
            emailLabel: '电子邮件 *',
            emailPlaceholder: 'example@email.com',
            passwordLabel: '密码 *',
            passwordPlaceholder: '最低6个字符',
            nameLabel: '创业项目名称 *',
            namePlaceholder: '如普图马约蜂蜜',
            categoryLabel: '类别 *',
            categoryPlaceholder: '选择一个类别',
            productLabel: '产品或服务 *',
            productPlaceholder: '如有机蜂蜜',
            descriptionLabel: '描述 *',
            descriptionPlaceholder: '描述您的创业项目',
            locationLabel: '位置 *',
            locationPlaceholder: '如Mocoa, Putumayo',
            whatsappLabel: 'WhatsApp (10位数字，例如3227994023) *',
            whatsappPlaceholder: '如3227994023',
            whatsappTitle: '号码必须正好有10位数字（例如3227994023）',
            imageLabel: '创业项目图片 *',
            submitButton: '注册',
            shareTitle: '分享创业项目',
            closeShareButton: '关闭',
            errorWhatsapp: '❌ WhatsApp号码必须正好有10位数字。',
            errorImage: '❌ 请为您的创业项目选择一张图片。',
            successMessage: '✅ 注册成功！',
            errorMessage: '❌ 注册时出错。请稍后重试。',
            saveCredentialsPrompt: '您想为未来的登录保存用户名和密码吗？',
            noProducers: '未找到创业项目。',
            loadingProducers: '加载创业项目...',
            contactWhatsApp: '通过WhatsApp联系',
            shareButton: '分享',
            languageLabel: '语言'
        }
    };

    function translatePage(lang) {
        const t = translations[lang];

        // Header
        document.querySelector('h1').textContent = t.headerTitle;
        document.querySelector('header p').textContent = t.headerSubtitle;
        document.getElementById('search-input').placeholder = t.searchPlaceholder;
        document.getElementById('producers-count').querySelector('p').textContent = `${document.getElementById('count').textContent} ${t.producersCount}`;
        document.getElementById('language-btn').innerHTML = `<i class="fas fa-globe"></i> ${t.languageLabel}`;
        
        // Category Buttons
        document.querySelector('.category-btn.main-btn .category-label textPath').textContent = t.categoryAll;
        document.querySelector('[data-category="agricultura"] .category-label textPath').textContent = t.categoryAgricultura;
        document.querySelector('[data-category="agroindustria"] .category-label textPath').textContent = t.categoryAgroindustria;
        document.querySelector('[data-category="artesania"] .category-label textPath').textContent = t.categoryArtesania;
        document.querySelector('[data-category="gastronomia"] .category-label textPath').textContent = t.categoryGastronomia;
        document.querySelector('[data-category="turismo"] .category-label textPath').textContent = t.categoryTurismo;
        document.querySelector('[data-category="varios"] .category-label textPath').textContent = t.categoryVarios;

        // Footer
        document.getElementById('register-prompt').innerHTML = `${t.registerPrompt}<a href="#" id="add-btn">${t.registerLink}</a>`;
        document.getElementById('developer-note').textContent = t.developerNote;
        document.getElementById('developer-name').textContent = t.developerName;

        // Modal
        document.querySelector('#modal h2').textContent = t.modalTitle;
        document.querySelector('label[for="email"]').textContent = t.emailLabel;
        document.getElementById('email').placeholder = t.emailPlaceholder;
        document.querySelector('label[for="password"]').textContent = t.passwordLabel;
        document.getElementById('password').placeholder = t.passwordPlaceholder;
        document.querySelector('label[for="name"]').textContent = t.nameLabel;
        document.getElementById('name').placeholder = t.namePlaceholder;
        document.querySelector('label[for="category"]').textContent = t.categoryLabel;
        document.querySelector('#category option[disabled]').textContent = t.categoryPlaceholder;

        // Translate category options in the select dropdown
        document.querySelector('#category option[value="agricultura"]').textContent = t.categoryAgricultura;
        document.querySelector('#category option[value="agroindustria"]').textContent = t.categoryAgroindustria;
        document.querySelector('#category option[value="artesania"]').textContent = t.categoryArtesania;
        document.querySelector('#category option[value="gastronomia"]').textContent = t.categoryGastronomia;
        document.querySelector('#category option[value="turismo"]').textContent = t.categoryTurismo;
        document.querySelector('#category option[value="varios"]').textContent = t.categoryVarios;

        document.querySelector('label[for="product"]').textContent = t.productLabel;
        document.getElementById('product').placeholder = t.productPlaceholder;
        document.querySelector('label[for="description"]').textContent = t.descriptionLabel;
        document.getElementById('description').placeholder = t.descriptionPlaceholder;
        document.querySelector('label[for="location"]').textContent = t.locationLabel;
        document.getElementById('location').placeholder = t.locationPlaceholder;
        document.querySelector('label[for="whatsapp"]').textContent = t.whatsappLabel;
        document.getElementById('whatsapp').placeholder = t.whatsappPlaceholder;
        document.getElementById('whatsapp').title = t.whatsappTitle;
        document.querySelector('label[for="image"]').textContent = t.imageLabel;
        document.querySelector('#register-form button[type="submit"]').textContent = t.submitButton;

        // Share Modal
        document.querySelector('#share-modal h3').textContent = t.shareTitle;
        document.querySelector('#close-share-modal').textContent = t.closeShareButton;

        // Reload producers to ensure dynamic content is translated
        loadProducers(searchQuery, currentCategory);
    }

    function setupLanguageToggle() {
        const languageBtn = document.getElementById('language-btn');
        const languageMenu = document.getElementById('language-menu');

        languageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            languageMenu.classList.toggle('open');
            if (navigator.vibrate) navigator.vibrate(50);
        });

        document.querySelectorAll('.language-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.dataset.lang;
                currentLang = lang;
                localStorage.setItem('language', lang);
                translatePage(lang);
                languageMenu.classList.remove('open'); // Ensure menu closes after selection
                searchQuery = document.getElementById('search-input').value; // Preserve search query
                loadProducers(searchQuery, currentCategory); // Reload producers after language change
            });
        });

        document.addEventListener('click', (e) => {
            if (!languageBtn.contains(e.target) && !languageMenu.contains(e.target)) {
                languageMenu.classList.remove('open');
            }
        });

        translatePage(currentLang);
    }

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

    function openWhatsApp(number, message = translations[currentLang].contactWhatsApp) {
        const cleanNumber = number.toString().replace(/[^0-9]/g, '');
        const finalNumber = cleanNumber.length === 10 ? `+57${cleanNumber}` : `+${cleanNumber}`;

        if (navigator.share) {
            navigator.share({
                title: translations[currentLang].headerTitle,
                text: message,
                url: `${BASE_URL}/emprendimiento/${Date.now()}`
            }).catch(err => console.error('Error sharing via Web Share:', err));
        } else {
            const whatsappUrl = `whatsapp://send?phone=${finalNumber}&text=${encodeURIComponent(message)}`;
            const fallbackUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;

            const link = document.createElement('a');
            link.href = whatsappUrl;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                window.location.href = fallbackUrl;
            }, 1000);
        }
    }

    function setupWhatsAppButtons() {
        document.querySelectorAll('.producer-whatsapp-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (navigator.vibrate) navigator.vibrate(50);
                openWhatsApp(button.dataset.whatsapp);
            });
        });
    }

    const shareOptions = {
        whatsapp: {
            id: 'whatsapp-share',
            icon: 'fab fa-whatsapp',
            action: (producerId, title) => {
                const message = `🌴 ${translations[currentLang].shareTitle}: ${title} 🚀 ${BASE_URL}/emprendimiento/${producerId}`;
                if (navigator.share) {
                    navigator.share({
                        title: translations[currentLang].headerTitle,
                        text: message,
                        url: `${BASE_URL}/emprendimiento/${producerId}`
                    }).catch(err => console.error('Error sharing via Web Share:', err));
                } else {
                    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
                    const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    setTimeout(() => window.location.href = fallbackUrl, 1000);
                }
            }
        },
        facebook: {
            id: 'facebook-share',
            icon: 'fab fa-facebook',
            action: (producerId, title) => {
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ${translations[currentLang].shareTitle}: ${title} 🚀 ${url}`;
                if (navigator.share) {
                    navigator.share({
                        title: translations[currentLang].headerTitle,
                        text: message,
                        url: url
                    }).catch(err => console.error('Error sharing via Web Share:', err));
                } else {
                    const fbUrl = `fb://share/?text=${encodeURIComponent(message)}`;
                    const fallbackUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    window.open(fbUrl, '_blank');
                    setTimeout(() => window.location.href = fallbackUrl, 1000);
                }
            }
        },
        twitter: {
            id: 'twitter-share',
            icon: 'fab fa-x-twitter',
            action: (producerId, title) => {
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ${translations[currentLang].shareTitle}: ${title} 🚀 ${url}`;
                if (navigator.share) {
                    navigator.share({
                        title: translations[currentLang].headerTitle,
                        text: message,
                        url: url
                    }).catch(err => console.error('Error sharing via Web Share:', err));
                } else {
                    const twitterUrl = `twitter://post?text=${encodeURIComponent(message)}`;
                    const fallbackUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
                    window.open(twitterUrl, '_blank');
                    setTimeout(() => window.location.href = fallbackUrl, 1000);
                }
            }
        },
        tiktok: {
            id: 'tiktok-share',
            icon: 'fab fa-tiktok',
            action: (producerId, title) => {
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ${translations[currentLang].shareTitle}: ${title} 🚀 ${url}`;
                if (navigator.share) {
                    navigator.share({
                        title: translations[currentLang].headerTitle,
                        text: message,
                        url: url
                    }).catch(err => console.error('Error sharing via Web Share:', err));
                } else {
                    navigator.clipboard.writeText(message).then(() => {
                        alert('Mensaje copiado. Pégalo en tu publicación de TikTok.');
                    }).catch(err => {
                        console.error('Error copying to clipboard:', err);
                        alert('Error al copiar. Copia manualmente: ' + message);
                    });
                }
            }
        },
        instagram: {
            id: 'instagram-share',
            icon: 'fab fa-instagram',
            action: (producerId, title) => {
                const url = `${BASE_URL}/emprendimiento/${producerId}`;
                const message = `🌴 ${translations[currentLang].shareTitle}: ${title} 🚀 ${url}`;
                if (navigator.share) {
                    navigator.share({
                        title: translations[currentLang].headerTitle,
                        text: message,
                        url: url
                    }).catch(err => console.error('Error sharing via Web Share:', err));
                } else {
                    navigator.clipboard.writeText(message).then(() => {
                        alert('Mensaje copiado. Pégalo en tu publicación de Instagram.');
                    }).catch(err => {
                        console.error('Error copying to clipboard:', err);
                        alert('Error al copiar. Copia manualmente: ' + message);
                    });
                }
            }
        }
    };

    function setupShareButtons() {
        const modal = document.getElementById('share-modal');
        Object.values(shareOptions).forEach(option => {
            document.getElementById(option.id)?.addEventListener('click', (e) => {
                e.preventDefault();
                const producerId = modal.dataset.producerId;
                const title = document.getElementById('share-title').textContent;
                option.action(producerId, title);
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
            });
            const currentButton = subButtons[currentIndex];
            if (currentButton) {
                currentButton.classList.add('glow');
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
        });
    }

    async function loadProducers(searchQuery = "", category = currentCategory) {
        const producersList = document.getElementById('producers-list');
        const countElement = document.getElementById('count');
        producersList.innerHTML = '<p>' + translations[currentLang].loadingProducers + '</p>';

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
            producersList.innerHTML = '<p>' + translations[currentLang].noProducers + '</p>';
            return;
        }

        filteredProducers.forEach((producer, index) => {
            const categoryName =
                producer.category.toLowerCase() === 'agricultura' ? translations[currentLang].categoryAgricultura :
                producer.category.toLowerCase() === 'artesania' ? translations[currentLang].categoryArtesania :
                producer.category.toLowerCase() === 'turismo' ? translations[currentLang].categoryTurismo :
                producer.category.toLowerCase() === 'gastronomia' ? translations[currentLang].categoryGastronomia :
                producer.category.toLowerCase() === 'agroindustria' ? translations[currentLang].categoryAgroindustria :
                translations[currentLang].categoryVarios;

            const card = document.createElement('div');
            card.className = 'producer-card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <img src="${producer.image || '/images/logo.png'}" alt="${producer.product}" loading="lazy">
                <div class="producer-info">
                    <h3>${producer.name}</h3>
                    <span class="category-badge ${producer.category.toLowerCase()}">${categoryName}</span>
                    <p><strong>${translations[currentLang].productLabel.split(' *')[0]}:</strong> ${producer.product}</p>
                    <p><strong>${translations[currentLang].locationLabel.split(' *')[0]}:</strong> ${producer.location}</p>
                    <p>${producer.description}</p>
                    <div class="producer-actions">
                        <a href="#" class="producer-whatsapp-btn whatsapp-btn" data-producer-id="${producer.id}" data-whatsapp="${producer.whatsapp}">
                            <i class="fab fa-whatsapp"></i> ${translations[currentLang].contactWhatsApp}
                        </a>
                        <button class="share-btn" data-producer-id="${producer.id}" data-name="${producer.name}" data-product="${producer.product}">
                            <i class="fas fa-share-nodes"></i> ${translations[currentLang].shareButton}
                        </button>
                    </div>
                </div>
            `;
            producersList.appendChild(card);
        });

        setupWhatsAppButtons();
        setupShareButtons();
    }

    function setupSearch() {
        const searchInput = document.getElementById('search-input');
        let searchTimeout;

        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = searchInput.value;
                loadProducers(searchQuery, currentCategory);
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
            'all': translations[currentLang].categoryAll,
            'agricultura': translations[currentLang].categoryAgricultura,
            'agroindustria': translations[currentLang].categoryAgroindustria,
            'artesania': translations[currentLang].categoryArtesania,
            'gastronomia': translations[currentLang].categoryGastronomia,
            'turismo': translations[currentLang].categoryTurismo,
            'varios': translations[currentLang].categoryVarios
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
            });

            button.addEventListener('mouseleave', () => {
                button.classList.remove('glow');
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
                formMessage.textContent = translations[currentLang].errorWhatsapp;
                formMessage.style.color = 'red';
                return;
            }

            if (!imageInput.files || imageInput.files.length === 0) {
                formMessage.textContent = translations[currentLang].errorImage;
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

                formMessage.textContent = translations[currentLang].successMessage;
                formMessage.style.color = 'green';
                registerForm.reset();

                const email = formData.get('email');
                const password = formData.get('password');
                const saveCredentials = confirm(translations[currentLang].saveCredentialsPrompt);
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
                formMessage.textContent = translations[currentLang].errorMessage;
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
        setupLanguageToggle();
        loadProducers();
    }

    init();
});