const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `producer-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage: storage });

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Archivos para almacenar datos
const CLICKS_FILE = path.join(__dirname, 'clicks.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const PRODUCERS_FILE = path.join(__dirname, 'public/producers.json'); // Archivo de productores

// Inicializar archivos si no existen
async function initializeFiles() {
    try {
        await fs.access(CLICKS_FILE);
    } catch {
        await fs.writeFile(CLICKS_FILE, JSON.stringify([]));
    }
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
    try {
        await fs.access(PRODUCERS_FILE);
    } catch {
        await fs.writeFile(PRODUCERS_FILE, JSON.stringify([]));
    }
}
initializeFiles();

// Ruta para registrar un nuevo usuario con imagen y guardar el emprendimiento
app.post('/api/register-user', upload.single('image'), async (req, res) => {
    const { email, password, name, category, product, description, location, whatsapp, producerId } = req.body;

    // Validar que se haya subido una imagen
    if (!req.file) {
        return res.status(400).json({ error: 'La imagen es obligatoria' });
    }
    const image = `/images/${req.file.filename}`; // Usar la imagen subida

    try {
        // Registrar usuario en users.json
        const users = JSON.parse(await fs.readFile(USERS_FILE));
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        users.push({ email, password, producerId });
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

        // Añadir emprendimiento a producers.json
        const producers = JSON.parse(await fs.readFile(PRODUCERS_FILE));
        const newProducer = {
            id: parseInt(producerId),
            name,
            category,
            product,
            description,
            location,
            phone: "", // No se proporciona en el formulario, se deja vacío
            whatsapp,
            image
        };
        producers.push(newProducer);
        await fs.writeFile(PRODUCERS_FILE, JSON.stringify(producers, null, 2));

        res.json({ success: true, producer: newProducer });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Ruta para registrar un clic
app.post('/api/track-click', async (req, res) => {
    const { producerId } = req.body;
    try {
        const clicks = JSON.parse(await fs.readFile(CLICKS_FILE));
        const click = { producerId, timestamp: new Date().toISOString() };
        clicks.push(click);
        await fs.writeFile(CLICKS_FILE, JSON.stringify(clicks, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).json({ error: 'Failed to track click' });
    }
});

// Ruta para obtener estadísticas de un usuario
app.get('/api/stats/:producerId', async (req, res) => {
    const { producerId } = req.params;
    try {
        const clicks = JSON.parse(await fs.readFile(CLICKS_FILE));
        const userClicks = clicks.filter(click => click.producerId === producerId);
        res.json({ producerId, clicks: userClicks.length });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Ruta para login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const users = JSON.parse(await fs.readFile(USERS_FILE));
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ success: true, producerId: user.producerId });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Ruta para restablecer datos (borrar emprendimientos e imágenes)
app.post('/api/reset-data', async (req, res) => {
    try {
        // Restablecer producers.json
        await fs.writeFile(PRODUCERS_FILE, JSON.stringify([], null, 2));

        // Restablecer users.json
        await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));

        // Restablecer clicks.json
        await fs.writeFile(CLICKS_FILE, JSON.stringify([], null, 2));

        // Eliminar imágenes de la carpeta public/images/
        const imagesDir = path.join(__dirname, 'public/images');
        const files = await fs.readdir(imagesDir);
        for (const file of files) {
            // Proteger selva2.jpg (o el nombre exacto que tenga tu imagen de fondo)
            if (file !== 'selva2.jpg') {
                await fs.unlink(path.join(imagesDir, file));
            }
        }

        res.json({ success: true, message: 'Datos e imágenes restablecidos correctamente' });
    } catch (error) {
        console.error('Error resetting data:', error);
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});