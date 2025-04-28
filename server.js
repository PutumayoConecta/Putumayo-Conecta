const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Cargar variables de entorno
dotenv.config();

// Configurar Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar Multer con Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const producerId = req.body.producerId || 'unknown';
        const timestamp = Date.now();
        return {
            folder: 'putumayo-conecta',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            public_id: `producer-${producerId}-${timestamp}`
        };
    }
});
const upload = multer({ storage });

// Configurar Mongoose y suprimir advertencia de strictQuery
mongoose.set('strictQuery', true);

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => {
        console.error('Error al conectar a MongoDB:', err.message);
        process.exit(1);
    });

// Definir esquemas y modelos
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    producerId: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const producerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    product: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    whatsapp: { type: String, required: true },
    image: { type: String, required: true }
});
const Producer = mongoose.model('Producer', producerSchema);

const clickSchema = new mongoose.Schema({
    producerId: { type: String, required: true },
    clicks: { type: Number, default: 0 }
});
const Click = mongoose.model('Click', clickSchema);

// Ruta para registrar usuario y emprendimiento
app.post('/api/register-user', upload.single('image'), async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        console.log('Archivo recibido:', req.file);

        const { email, password, name, category, product, description, location, whatsapp, producerId } = req.body;
        let image = req.file ? req.file.path : null;

        if (!image) {
            console.log('Error: No se subió ninguna imagen');
            return res.status(400).json({ success: false, error: 'Por favor, sube una imagen.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Error: Email ya registrado:', email);
            return res.status(400).json({ success: false, error: 'El email ya está registrado.' });
        }

        const existingProducer = await Producer.findOne({ id: producerId });
        if (existingProducer) {
            console.log('Error: producerId ya registrado:', producerId);
            return res.status(400).json({ success: false, error: 'El ID del emprendimiento ya está registrado.' });
        }

        const user = new User({ email, password, producerId });
        await user.save();
        console.log('Usuario guardado:', email);

        const producer = new Producer({
            id: producerId,
            name,
            category,
            product,
            description,
            location,
            whatsapp,
            image: image
        });
        await producer.save();
        console.log('Productor guardado:', producerId);

        const newPublicId = `producer-${producerId}-${producer._id}`;
        const originalPublicId = req.file.path
            .split('/')
            .slice(-2)
            .join('/')
            .split('.')[0];
        await cloudinary.uploader.rename(originalPublicId, `putumayo-conecta/${newPublicId}`);

        image = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v${Date.now()}/putumayo-conecta/${newPublicId}.jpg`;
        producer.image = image;
        await producer.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error al registrar:', error.message);
        console.error('Detalles del error:', error);
        res.status(500).json({ success: false, error: 'Error al registrar. Intenta de nuevo.', details: error.message });
    }
});

// Resto de las rutas
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
        }

        res.json({ success: true, producerId: user.producerId });
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        res.status(500).json({ success: false, error: 'Error al iniciar sesión.' });
    }
});

app.post('/api/track-click', async (req, res) => {
    try {
        const { producerId } = req.body;
        let click = await Click.findOne({ producerId });

        if (!click) {
            click = new Click({ producerId, clicks: 1 });
        } else {
            click.clicks += 1;
        }
        await click.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error al rastrear clic:', error.message);
        res.status(500).json({ success: false, error: 'Error al rastrear clic.' });
    }
});

app.get('/api/stats/:id', async (req, res) => {
    try {
        const producerId = req.params.id;
        const click = await Click.findOne({ producerId });

        const clickCount = click ? click.clicks : 0;
        res.json({ clicks: clickCount });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error.message);
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas.' });
    }
});

app.get('/api/producers', async (req, res) => {
    try {
        const producers = await Producer.find();
        res.json(producers);
    } catch (error) {
        console.error('Error al obtener productores:', error.message);
        res.status(500).json({ success: false, error: 'Error al obtener productores.' });
    }
});

// Sirve index.html para cualquier ruta no API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});