const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB');
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1); // Salir si no se puede conectar
});

const producerSchema = new mongoose.Schema({
    id: String,
    name: String,
    category: String,
    product: String,
    description: String,
    location: String,
    whatsapp: String,
    image: String,
    email: String,
    password: String
});

const Producer = mongoose.model('Producer', producerSchema);

async function updateWhatsAppNumbers() {
    try {
        const producers = await Producer.find();
        for (const producer of producers) {
            if (producer.whatsapp) {
                const cleanNumber = producer.whatsapp.replace(/[^0-9]/g, ''); // Eliminar cualquier carácter no numérico
                if (cleanNumber.length === 10 && !producer.whatsapp.startsWith('+')) {
                    producer.whatsapp = `+57${cleanNumber}`;
                    await producer.save();
                    console.log(`Actualizado número de WhatsApp para ${producer.name}: ${producer.whatsapp}`);
                } else if (cleanNumber.length === 12 && producer.whatsapp.startsWith('+57')) {
                    // Ya está en formato correcto, no hacer cambios
                    console.log(`Número de WhatsApp ya correcto para ${producer.name}: ${producer.whatsapp}`);
                } else {
                    console.warn(`Número de WhatsApp inválido para ${producer.name}: ${producer.whatsapp} (ignorado)`);
                }
            }
        }
        console.log('Actualización completada');
    } catch (error) {
        console.error('Error al actualizar los números:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión a MongoDB cerrada');
    }
}

updateWhatsAppNumbers();