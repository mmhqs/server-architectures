const { status } = require('@grpc/grpc-js');
const jwt = require('jsonwebtoken');

// Mapa para gerenciar os streams ativos dos clientes
const activeStreams = new Map();

class ChatService {
    async validateToken(token) {
        const jwtSecret = process.env.JWT_SECRET || 'seu-secret-aqui';
        try {
            return jwt.verify(token, jwtSecret);
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    /**
     * @param {grpc.ServerDuplexStream<ChatRequest, ChatResponse>} call
     */
    async streamChat(call) {
        let user;

        // Ouve dados do cliente (mensagens enviadas)
        call.on('data', async (request) => {
            try {
                if (!user) {
                    // primeira mensagem deve ter token
                    if (!request.token) {
                        call.end();
                        return;
                    }
                    user = await this.validateToken(request.token);
                    activeStreams.set(call, user);
                    console.log(`💬 Usuário ${user.username} entrou no chat.`);

                    // Envia uma notificação para todos os outros usuários
                    this.broadcast({
                        type: 'USER_JOINED',
                        message: {
                            userId: user.id,
                            username: user.username,
                            content: `${user.username} entrou no chat.`,
                            timestamp: Math.floor(Date.now() / 1000)
                        }
                    }, call); // Exclui o próprio remetente
                    return;
                }

                // Se não houver token, é uma mensagem de chat
                if (!user) {
                    call.end(); // Se não há usuário autenticado, encerra a conexão.
                    return;
                }

                if (request.type === 0 || request.type === 'CHAT_MESSAGE') {
                    const chatMessage = {
                        userId: user.id,
                        username: user.username,
                        content: request.message?.content ?? 'DEU RUIM FIA',
                        timestamp: Math.floor(Date.now() / 1000)
                    };

                    // Adicione esta linha para ver a mensagem no console do servidor
                    console.log(`[${chatMessage.username}]: ${chatMessage.content}`);

                    // Retransmite a mensagem para todos os clientes
                    this.broadcast({
                        type: 'CHAT_MESSAGE',
                        message: chatMessage
                    });
                }
            } catch (error) {
                console.error('❌ Erro no stream de chat:', error);
                call.end(); // Encerra a conexão
            }
        });

        // Ouve o encerramento da conexão pelo cliente
        call.on('end', () => {
            activeStreams.delete(call);
            if (user) {
                console.log(`💬 Usuário ${user.username} saiu do chat.`);
                this.broadcast({
                    type: 'USER_LEFT',
                    message: {
                        userId: user.id,
                        username: user.username,
                        content: `${user.username} saiu do chat.`,
                        timestamp: Math.floor(Date.now() / 1000)
                    }
                });
            }
        });

        // Ouve erros na conexão
        call.on('error', (error) => {
            console.error('❌ Erro no stream de chat:', error);
            activeStreams.delete(call);
        });
    }

    // Método para retransmitir mensagens para todos os clientes conectados
    broadcast(response, excludeCall = null) {
        for (const [stream, user] of activeStreams.entries()) {
            if (stream !== excludeCall) {
                stream.write(response);
            }
        }
    }
}

/* // === Prompt para enviar mensagens pelo console do servidor ===
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    const message = input.trim();
    if (message.length > 0) {
        for (const [stream] of activeStreams.entries()) {
            stream.write({
                type: 'CHAT_MESSAGE',
                message: {
                    userId: 'server',
                    username: 'Servidor',
                    content: message,
                    timestamp: Math.floor(Date.now() / 1000)
                }
            });
        }
        console.log(`🖥️ [Servidor]: ${message}`);
    }
}); */

module.exports = ChatService;