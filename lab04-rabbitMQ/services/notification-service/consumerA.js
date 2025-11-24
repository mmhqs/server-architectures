const amqp = require('amqplib');

// Configurações
const EXCHANGE_NAME = 'shopping_events';
const QUEUE_NAME = 'log_notification_queue'; // Nome da fila do Consumer A
const BINDING_KEY = 'list.checkout.#';       // Chave de ligação com curinga
const AMQP_URL = 'amqp://localhost:5673';      // Endereço do broker (configurei no docker run)

async function startConsumerA() {
    let connection;
    try {
        connection = await amqp.connect(AMQP_URL);
        const channel = await connection.createChannel();

        // 1. Declarar o Exchange (garantir que ele existe)
        await channel.assertExchange(EXCHANGE_NAME, 'topic', {
            durable: true
        });

        // 2. Declarar a Fila (Durável)
        const q = await channel.assertQueue(QUEUE_NAME, {
            durable: true
        });

        // 3. Criar o Binding com a chave curinga
        await channel.bindQueue(q.queue, EXCHANGE_NAME, BINDING_KEY);
        console.log(`[Consumidor A] Escutando a fila '${q.queue}' com binding key '${BINDING_KEY}'. Aguardando mensagens...`);

        // 4. Iniciar o Consumo
        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const messageContent = JSON.parse(msg.content.toString());
                
                const listId = messageContent.listId || 'N/A';
                // Assumindo que você pode obter o email do usuário
                const userEmail = `user-${messageContent.userId || 'N/A'}@domain.com`; 

                // Lógica de Logging/Notificação
                console.log('--------------------------------------------------');
                console.log(`[EVENTO RECEBIDO] Routing Key: ${msg.fields.routingKey}`);
                console.log(`[LOG] Enviando comprovante da lista [${listId}] para o usuário [${userEmail}]`);
                console.log('--------------------------------------------------');

                // 5. ACK (Confirmação):
                // ESSENCIAL: Avisa ao RabbitMQ que a mensagem foi processada com sucesso
                channel.ack(msg);
            }
        }, {
            noAck: false // Garante que o ACK seja manual
        });

    } catch (error) {
        console.error("[Consumidor A] Erro de conexão ou processamento:", error.message);
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error("Erro ao fechar conexão:", closeError);
            }
        }
        // Tentativa de reconexão ou encerramento
    }
}

startConsumerA();