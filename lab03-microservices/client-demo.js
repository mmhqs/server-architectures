const axios = require('axios');

class MicroservicesClient {
    constructor(gatewayUrl = 'http://127.0.0.1:3000') {
        this.gatewayUrl = gatewayUrl;
        this.authToken = null;
        this.user = null;

        // Configurar axios
        this.api = axios.create({
            baseURL: gatewayUrl,
            timeout: 10000,
            family: 4  // Forçar IPv4
        });

        // Interceptor para adicionar token automaticamente
        this.api.interceptors.request.use(config => {
            if (this.authToken) {
                config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            return config;
        });

        // Interceptor para log de erros
        this.api.interceptors.response.use(
            response => response,
            error => {
                console.error('Erro na requisição:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    message: error.response?.data?.message || error.message
                });
                return Promise.reject(error);
            }
        );
    }

    async register(userData) {
        try {
            console.log('\n1. Registrando usuário...');
            const response = await this.api.post('/api/users/auth/register', userData);

            if (response.data.success) {
                this.authToken = response.data.data.token;
                this.user = response.data.data.user;
                console.log('✅ Usuário registrado com sucesso.');
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha no registro');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('❌ Erro no registro:', message);
            throw error;
        }
    }

    async login(credentials) {
        try {
            console.log('\n2. Fazendo login...');
            const response = await this.api.post('/api/users/auth/login', credentials);

            if (response.data.success) {
                this.authToken = response.data.data.token;
                this.user = response.data.data.user;
                console.log('✅ Login realizado com sucesso.');
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha no login');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('❌ Erro no login:', message);
            throw error;
        }
    }

    async searchItems(query) {
        try {
            console.log('\n3. Buscando itens...');
            const response = await this.api.get('/api/items/search', { params: { q: query } });

            if (response.data.success) {
                const results = response.data.data.results;
                console.log(`✅ Encontrados ${results.length} itens para "${query}"`);
                results.forEach(item => {
                    console.log(`   - ${item.name} (ID: ${item.id}) - R$ ${item.price}`);
                });
                return results;
            } else {
                throw new Error(response.data.message || 'Falha na busca de itens');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('❌ Erro ao buscar itens:', message);
            return [];
        }
    }

    async createList(listData) {
        try {
            console.log('\n4. Criando nova lista...');
            const response = await this.api.post('/api/lists', listData);

            if (response.data.success) {
                const list = response.data.data;
                console.log(`✅ Lista "${list.name}" criada com sucesso (ID: ${list.id})`);
                return list;
            } else {
                throw new Error(response.data.message || 'Falha ao criar a lista');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('❌ Erro ao criar lista:', message);
            throw error;
        }
    }

    async addItemToList(listId, item) {
        try {
            console.log(`\n5. Adicionando item "${item.itemId}" à lista "${listId}"...`);
            const response = await this.api.post(`/api/lists/${listId}/items`, item);

            if (response.data.success) {
                console.log(`✅ Item adicionado com sucesso. Total de itens: ${response.data.data.items.length}`);
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Falha ao adicionar item à lista');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('❌ Erro ao adicionar item:', message);
            throw error;
        }
    }

    // Método de visualização do dashboard
    async getDashboard() {
        try {
            console.log('\n6. Visualizando o Dashboard...');
            const response = await this.api.get('/api/dashboard');

            if (response.data.success) {
                const dashboard = response.data.data;
                console.log('✅ Dashboard carregado com sucesso.');
                console.log(`   Status dos Serviços:`);
                if (dashboard.services_status) {
                    Object.entries(dashboard.services_status).forEach(([serviceName, serviceInfo]) => {
                        const status = serviceInfo.healthy ? 'SAUDÁVEL' : 'INDISPONÍVEL';
                        console.log(`     - ${serviceName}: ${status}`);
                    });
                }
                console.log(`   Total de listas de compras (usuário): ${dashboard.data.lists.data?.length || 0}`);
                return response.data;
            } else {
                throw new Error(response.data.message || 'Falha ao carregar dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            console.log('❌ Erro ao buscar dashboard:', message);
            throw error;
        }
    }

    // Demonstração completa
    async runDemo() {
        console.log('=====================================');
        console.log('DEMO: FLUXO COMPLETO DE LISTA DE COMPRAS');
        console.log('=====================================');

        try {
            // Passo 1: Registrar um novo usuário
            const uniqueId = Date.now();
            const userData = {
                email: `listdemo${uniqueId}@example.com`,
                username: `list_user${uniqueId}`,
                password: 'password123',
                firstName: 'Demo',
                lastName: 'Listas',
                preferences: {
                    defaultStore: 'Bombom',
                    currency: 'real'
                },
            };
            await this.register(userData);
            await this.delay(1000);

            // Passo 2: Login (para garantir o token)
            await this.login({
                identifier: `list_user${uniqueId}`,
                password: 'password123'
            });
            await this.delay(1000);

            // Passo 3: Buscar itens disponíveis (para pegar IDs)
            const availableItems = await this.searchItems('Smartphone');
            if (availableItems.length === 0) {
                console.log('Nenhum item encontrado, a demo será interrompida.');
                return;
            }
            const smartphoneId = availableItems[0].id;
            const item2Id = availableItems[1]?.id;
            await this.delay(1000);

            // Passo 4: Criar uma nova lista
            const listData = {
                name: "Lista de Compras da Demo",
                description: "Minha primeira lista criada por microsserviços"
            };
            const newList = await this.createList(listData);
            const newListId = newList.id;
            await this.delay(1000);

            // Passo 5: Adicionar itens à lista
            await this.addItemToList(newListId, { itemId: smartphoneId, quantity: 1, notes: "Cor preta" });
            if (item2Id) {
                await this.addItemToList(newListId, { itemId: item2Id, quantity: 2, purchased: true });
            }
            await this.delay(1000);

            // Passo 6: Visualizar o dashboard (agora incluindo informações de listas)
            await this.getDashboard();
            await this.delay(1000);

            console.log('\n=====================================');
            console.log('FLUXO DE DEMONSTRAÇÃO CONCLUÍDO!');
            console.log('=====================================');
        } catch (error) {
            console.error('Um erro ocorreu durante a demonstração:', error.message);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar demonstração
async function main() {
    const client = new MicroservicesClient();
    await client.runDemo();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Erro crítico:', error.message);
        process.exit(1);
    });
}

module.exports = MicroservicesClient;