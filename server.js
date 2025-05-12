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

// Logs para verificar las variables
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI no está definida. Verifica tu archivo .env.');
    process.exit(1);
}

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
    params: {
        folder: 'putumayo-conecta',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: (req, file) => `producer-${req.body.producerId || 'unknown'}-${Date.now()}`
    }
});
const upload = multer({ storage });

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Por favor, sube una imagen.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'El email ya está registrado.' });
        }

        const existingProducer = await Producer.findOne({ id: producerId });
        if (existingProducer) {
            return res.status(400).json({ success: false, error: 'El ID del emprendimiento ya está registrado.' });
        }

        const formattedWhatsapp = `+57${whatsapp.replace(/[^0-9]/g, '')}`;
        if (formattedWhatsapp.length !== 12) {
            return res.status(400).json({ success: false, error: 'El número de WhatsApp debe tener 10 dígitos.' });
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
            whatsapp: formattedWhatsapp,
            image: req.file.path
        });
        await producer.save();
        console.log('Productor guardado:', producerId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error al registrar:', error.message, error.stack);
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