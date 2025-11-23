const amqp = require('amqplib');

// Configurações do RabbitMQ
const EXCHANGE_NAME = 'shopping_events';
const QUEUE_NAME = 'list_checkout_processor';
const ROUTING_KEY = 'list.checkout.completed';
const AMQP_URL = 'amqp://localhost'; // Altere conforme o endereço do seu broker

let connection = null;
let channel = null;

async function connectAndSetup() {
    // Se a conexão já existe, retorna os objetos existentes.
    if (channel) return { connection, channel };

    try {
        // 1. Conectar-se ao RabbitMQ
        connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();

        // 2. Declarar o Exchange (O Produtor só PRECISA disso para publicar)
        await channel.assertExchange(EXCHANGE_NAME, 'topic', {
            durable: true
        });
        console.log(`Exchange '${EXCHANGE_NAME}' garantido.`);

        // NOTA: As declarações de Fila e Binding (3 e 4) são
        // tecnicamente responsabilidade do CONSUMIDOR, mas tê-las aqui
        // garante que o Producer NUNCA publique em um Exchange sem Fila.
        // Se este arquivo for usado pelo Consumidor, continue assim.

        return { connection, channel, EXCHANGE_NAME, ROUTING_KEY };

    } catch (error) {
        console.error("Erro ao conectar ou configurar o RabbitMQ:", error);
        // Em um projeto real, você implementaria reconexão aqui
        throw error; 
    }
}

/**
 * Publica um evento de 'list.checkout.completed' no Exchange.
 * @param {object} messageData - Dados da mensagem a ser enviada.
 */
function publishListCheckout(messageData) {
    if (!channel) {
        console.error("[RabbitMQ] Não foi possível publicar: Canal não está ativo.");
        // Você pode implementar uma fila interna para retries aqui.
        return false;
    }

    const msg = Buffer.from(JSON.stringify(messageData));
    
    // O retorno 'true' não significa que a mensagem chegou ao Exchange, 
    // mas sim que ela foi escrita no buffer do canal.
    return channel.publish(
        EXCHANGE_NAME,
        ROUTING_KEY,
        msg, {
            persistent: true // Mensagem durável
        }
    );
}

// Exporta a função que estabelece a conexão e o canal
module.exports = {
    connectAndSetup,
    publishListCheckout,
    EXCHANGE_NAME,
    ROUTING_KEY
};