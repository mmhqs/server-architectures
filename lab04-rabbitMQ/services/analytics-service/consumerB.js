const amqp = require('amqplib');

const EXCHANGE_NAME = 'shopping_events';
const BINDING_KEY = 'list.checkout.#'; // Escuta todas as chaves que começam com 'list.checkout.'
const QUEUE_NAME = 'analytics_service_processor';
const AMQP_URL = 'amqp://localhost:5673';

async function startConsumerB() {
    console.log("[Analytics Service] Conectando ao RabbitMQ...");
    let connection, channel;

    try {
        connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();

        // Declarar o Exchange (se já não existir, será criado)
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        // Declarar a Fila ÚNICA do Consumer B
        const q = await channel.assertQueue(QUEUE_NAME, {
            durable: true // Garante que a fila sobreviva ao broker
        });

        // Ligar a Fila ao Exchange com a Chave de Roteamento
        await channel.bindQueue(q.queue, EXCHANGE_NAME, BINDING_KEY);
        
        console.log(`[Analytics Service] Esperando por mensagens na fila: ${q.queue}.`);
        console.log(`[Analytics Service] Chave de Escuta (Binding Key): ${BINDING_KEY}`);

        // Consumir as Mensagens
        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const eventData = JSON.parse(msg.content.toString());
                
                // -----------------------------------------------------------------
                // 💡 Lógica Específica do Consumer B: Calcular o Total
                // -----------------------------------------------------------------
                const totalGasto = calcularTotalGasto(eventData.listItems);
                
                console.log('--------------------------------------------------');
                console.log(`[Analytics] Evento Recebido: ${msg.fields.routingKey}`);
                console.log(`[Analytics] Processando a lista de checkout ${eventData.listId}...`);
                console.log(`[Analytics] **VALOR TOTAL GASTO CALCULADO: R$ ${totalGasto.toFixed(2)}**`);
                console.log('--------------------------------------------------');

                // Confirma o processamento e remove a mensagem da fila
                channel.ack(msg); 
            }
        });

    } catch (error) {
        console.error("[Analytics Service] Erro Fatal no Consumer B:", error);
    }
}

/**
 * Simula o cálculo do total gasto com base nos itens da lista.
 * Assume que cada item tem uma propriedade 'price' (Preço) e 'quantity' (Quantidade).
 * * NOTA: O payload que seu List Service envia deve conter estas propriedades
 * para que este cálculo seja útil (Simulação).
 * @param {Array<object>} items - Array de itens com preço e quantidade.
 * @returns {number} O total gasto.
 */
function calcularTotalGasto(items) {
    if (!items || items.length === 0) return 0;
    
    // Simulação: se o List Service enviou um array de strings (como no seu exemplo inicial),
    // vamos assumir um preço padrão para simular o cálculo.
    let total = 0;
    if (typeof items[0] === 'string') {
        // Se for um array de strings, assume-se que cada item custou R$ 10.50
        total = items.length * 10.50; 
    } else {
        // Se for um array de objetos, calcula-se o total real (Melhor Prática)
        total = items.reduce((acc, item) => {
            // Assumindo que o item tem item.price e item.quantity
            const price = item.price || 5.00; // Preço padrão se não tiver
            const quantity = item.quantity || 1; // Quantidade padrão se não tiver
            return acc + (price * quantity);
        }, 0);
    }
    
    return total;
}

startConsumerB();