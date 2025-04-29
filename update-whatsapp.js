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
            if (producer.whatsapp && !producer.whatsapp.startsWith('+')) {
                producer.whatsapp = `+${producer.whatsapp}`;
                await producer.save();
                console.log(`Actualizado número de WhatsApp para ${producer.name}: ${producer.whatsapp}`);
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