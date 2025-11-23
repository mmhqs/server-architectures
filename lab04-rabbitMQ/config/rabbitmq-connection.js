const amqp = require('amqplib');

// Configurações do RabbitMQ
const EXCHANGE_NAME = 'shopping_events';
const QUEUE_NAME = 'list_checkout_processor';
const ROUTING_KEY = 'list.checkout.completed';
const AMQP_URL = 'amqp://localhost'; // Altere conforme o endereço do seu broker

async function setupRabbitMQ() {
    try {
        // 1. Conectar-se ao RabbitMQ
        const connection = await amqp.connect(AMQP_URL);
        const channel = await connection.createChannel();

        // 2. Declarar o Exchange (Topic, Durável)
        // O tipo 'topic' é recomendado para roteamento baseado em padrões como o seu.
        await channel.assertExchange(EXCHANGE_NAME, 'topic', {
            durable: true
        });
        console.log(`Exchange '${EXCHANGE_NAME}' declarado.`);

        // 3. Declarar a Fila (Durável)
        const q = await channel.assertQueue(QUEUE_NAME, {
            durable: true // Garante que a fila sobreviva a reinicializações
        });
        console.log(`Fila '${q.queue}' declarada.`);

        // 4. Criar o Binding (Ligação)
        // Diz ao Exchange para enviar mensagens com a ROUTING_KEY para a QUEUE_NAME
        await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY);
        console.log(`Binding criado: ${EXCHANGE_NAME} -> ${q.queue} com chave '${ROUTING_KEY}'`);

        // Opcional: Iniciar o consumo de mensagens aqui (serviço consumidor)
        // channel.consume(q.queue, (msg) => { ... }, { noAck: false });

    } catch (error) {
        console.error("Erro ao configurar o RabbitMQ:", error);
    }
}

setupRabbitMQ();