const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB');
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
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
                // Limpiar el número (solo dejar dígitos)
                let cleanNumber = producer.whatsapp.replace(/[^0-9]/g, '');

                // Verificar que tenga 10 dígitos
                if (cleanNumber.length === 10) {
                    producer.whatsapp = `+57${cleanNumber}`;
                    await producer.save();
                    console.log(`Actualizado número de WhatsApp para ${producer.name}: ${producer.whatsapp}`);
                } else if (cleanNumber.length !== 0) {
                    console.log(`Número inválido para ${producer.name}, valor original: ${producer.whatsapp}, limpio: ${cleanNumber}. Se omitió.`);
                }
            } else {
                console.log(`No se encontró número de WhatsApp para ${producer.name}`);
            }
        }
        console.log('Actualización completada');
    } catch (error) {
        console.error('Error al actualizar los números:', error);
    } finally {
        mongoose.connection.close();
    }
}

updateWhatsAppNumbers();