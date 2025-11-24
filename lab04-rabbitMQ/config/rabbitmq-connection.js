const amqp = require('amqplib');

// Configurações do RabbitMQ
const EXCHANGE_NAME = 'shopping_events';
const ROUTING_KEY = 'list.checkout.completed';
const AMQP_URL = 'amqp://localhost:5673'; // Porta exposta no Docker

let connection = null;
let channel = null;

async function connectAndSetup() {
    // Se a conexão já existe, retorna os objetos existentes.
    if (channel) return { channel };

    try {
        // 1. Conectar-se ao RabbitMQ
        connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();

        // 2. Declarar o Exchange (O Produtor só PRECISA disso para publicar)
        await channel.assertExchange(EXCHANGE_NAME, 'topic', {
            durable: true
        });

        return { connection, channel, EXCHANGE_NAME, ROUTING_KEY };

    } catch (error) {
        console.error("Erro ao conectar ou configurar o RabbitMQ:", error);
        throw error; 
    }
}

/**
 * Publica um evento de 'list.checkout.completed' no Exchange.
 * @param {object} messageData - Dados da mensagem a ser enviada.
 */
function publishListCheckout(messageData) {
    if (!channel) {
        console.error("Não foi possível publicar pelo RabbitMQ porque o canal não está ativo.");
        return false;
    }

    const dynamicRoutingKey = `list.checkout.${messageData.listId}`;

    const msg = Buffer.from(JSON.stringify(messageData));
    
    // O retorno 'true' não significa que a mensagem chegou ao Exchange, mas sim que ela foi escrita no buffer do canal.
    return channel.publish(
        EXCHANGE_NAME,
        dynamicRoutingKey,
        msg, {
            persistent: true
        }
    );
}

module.exports = {
    connectRabbitMQ: connectAndSetup,
    publishListCheckout,
    EXCHANGE_NAME,
    ROUTING_KEY
};