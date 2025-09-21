const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios');

const JsonDatabase = require('../../shared/JsonDatabase');
const serviceRegistry = require('../../shared/serviceRegistry');

class ListService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.serviceName = 'list-service';
        this.serviceUrl = `http://127.0.0.1:${this.port}`;
        
        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.listsDb = new JsonDatabase(dbPath, 'lists');
        console.log('List Service: Banco NoSQL inicializado');
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Service info headers
        this.app.use((req, res, next) => {
            res.setHeader('X-Service', this.serviceName);
            res.setHeader('X-Service-Version', '1.0.0');
            res.setHeader('X-Database', 'JSON-NoSQL');
            next();
        });
    }

    setupRoutes() {
        // Health check and service info
        this.app.get('/health', async (req, res) => {
            const listCount = await this.listsDb.count();
            res.json({
                service: this.serviceName,
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                database: {
                    type: 'JSON-NoSQL',
                    listCount: listCount
                }
            });
        });

        this.app.get('/', (req, res) => {
            res.json({
                service: 'List Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de listas de compras',
                database: 'JSON-NoSQL',
                endpoints: [
                    'POST /lists',
                    'GET /lists',
                    'GET /lists/:id',
                    'PUT /lists/:id',
                    'DELETE /lists/:id',
                    'POST /lists/:id/items',
                    'PUT /lists/:id/items/:itemId',
                    'DELETE /lists/:id/items/:itemId',
                    'GET /lists/:id/summary'
                ]
            });
        });

        // Endpoints de listas de compras (protegidos por autenticação)
        this.app.post('/lists', this.authMiddleware.bind(this), this.createList.bind(this));
        this.app.get('/lists', this.authMiddleware.bind(this), this.getLists.bind(this));
        this.app.get('/lists/:id', this.authMiddleware.bind(this), this.getList.bind(this));
        this.app.put('/lists/:id', this.authMiddleware.bind(this), this.updateList.bind(this));
        this.app.delete('/lists/:id', this.authMiddleware.bind(this), this.deleteList.bind(this));
        this.app.post('/lists/:id/items', this.authMiddleware.bind(this), this.addItemToList.bind(this));
        this.app.put('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.updateListItem.bind(this));
        this.app.delete('/lists/:id/items/:itemId', this.authMiddleware.bind(this), this.deleteListItem.bind(this));
        this.app.get('/lists/:id/summary', this.authMiddleware.bind(this), this.getListSummary.bind(this));
    }

    setupErrorHandling() {
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint não encontrado',
                service: this.serviceName
            });
        });

        this.app.use((error, req, res, next) => {
            console.error('List Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    async authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação obrigatório'
            });
        }

        try {
            const userService = serviceRegistry.discover('user-service');
            const token = authHeader.replace('Bearer ', '');
            
            const response = await axios.post(`${userService.url}/auth/validate`, { token }, { timeout: 5000 });

            if (response.data.success) {
                req.user = response.data.data.user;
                next();
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
        } catch (error) {
            console.error('Erro na validação do token:', error.message);
            res.status(503).json({
                success: false,
                message: 'Serviço de autenticação indisponível'
            });
        }
    }

    async createList(req, res) {
        try {
            const { name, description } = req.body;
            const userId = req.user.id;
            
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'O nome da lista é obrigatório'
                });
            }

            const newList = await this.listsDb.create({
                id: uuidv4(),
                userId,
                name,
                description: description || '',
                status: 'active',
                items: [],
                summary: {
                    totalItems: 0,
                    purchasedItems: 0,
                    estimatedTotal: 0
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Lista criada com sucesso',
                data: newList
            });
        } catch (error) {
            console.error('Erro ao criar lista:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    async getLists(req, res) {
        try {
            const userId = req.user.id;
            const { status } = req.query;
            const filter = { userId };
            if (status) {
                filter.status = status;
            }
            const lists = await this.listsDb.find(filter);
            res.json({ success: true, data: lists });
        } catch (error) {
            console.error('Erro ao listar listas:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    async getList(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const list = await this.listsDb.findOne({ id, userId });

            if (!list) {
                return res.status(404).json({ success: false, message: 'Lista não encontrada' });
            }

            res.json({ success: true, data: list });
        } catch (error) {
            console.error('Erro ao buscar lista:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    async updateList(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { name, description, status } = req.body;

            const list = await this.listsDb.findOne({ id, userId });
            if (!list) {
                return res.status(404).json({ success: false, message: 'Lista não encontrada' });
            }

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (status !== undefined) updates.status = status;
            updates.updatedAt = new Date().toISOString();

            const updatedList = await this.listsDb.update(id, updates);
            res.json({ success: true, message: 'Lista atualizada com sucesso', data: updatedList });
        } catch (error) {
            console.error('Erro ao atualizar lista:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    async deleteList(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const list = await this.listsDb.findOne({ id, userId });
            
            if (!list) {
                return res.status(404).json({ success: false, message: 'Lista não encontrada' });
            }

            // Realiza um soft delete (arquiva a lista)
            const archivedList = await this.listsDb.update(id, {
                status: 'archived',
                updatedAt: new Date().toISOString()
            });

            res.json({ success: true, message: 'Lista arquivada com sucesso', data: archivedList });
        } catch (error) {
            console.error('Erro ao deletar lista:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    async addItemToList(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { itemId, quantity = 1, notes = '' } = req.body;
            
            if (!itemId) {
                return res.status(400).json({ success: false, message: 'ID do item é obrigatório' });
            }

            const list = await this.listsDb.findOne({ id, userId });
            if (!list) {
                return res.status(404).json({ success: false, message: 'Lista não encontrada' });
            }

            // Descobrir o Item Service e buscar o item
            const itemService = serviceRegistry.discover('item-service');
            const itemResponse = await axios.get(`${itemService.url}/items/${itemId}`);
            const itemData = itemResponse.data.data;
            
            if (!itemData) {
                return res.status(404).json({ success: false, message: 'Produto não encontrado' });
            }
            
            const newItem = {
                itemId: itemData.id,
                itemName: itemData.name,
                quantity: parseInt(quantity),
                unit: itemData.unit,
                estimatedPrice: parseFloat(itemData.price),
                purchased: false,
                notes,
                addedAt: new Date().toISOString()
            };

            const updatedList = await this.listsDb.update(id, {
                items: [...list.items, newItem],
                updatedAt: new Date().toISOString()
            });

            this.updateListSummary(updatedList);

            res.status(201).json({ success: true, message: 'Item adicionado com sucesso', data: updatedList });
        } catch (error) {
            console.error('Erro ao adicionar item:', error.message);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    async updateListItem(req, res) {
        try {
            const { id, itemId } = req.params;
            const userId = req.user.id;
            const { quantity, purchased, notes } = req.body;
            
            const list = await this.listsDb.findOne({ id, userId });
            if (!list) {
                return res.status(404).json({ success: false, message: 'Lista não encontrada' });
            }

            const itemIndex = list.items.findIndex(item => item.itemId === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Item não encontrado na lista' });
            }

            const updatedItems = [...list.items];
            if (quantity !== undefined) updatedItems[itemIndex].quantity = parseInt(quantity);
            if (purchased !== undefined) updatedItems[itemIndex].purchased = purchased;
            if (notes !== undefined) updatedItems[itemIndex].notes = notes;
            
            const updatedList = await this.listsDb.update(id, {
                items: updatedItems,
                updatedAt: new Date().toISOString()
            });

            this.updateListSummary(updatedList);
            
            res.json({ success: true, message: 'Item atualizado com sucesso', data: updatedList });
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    async deleteListItem(req, res) {
        try {
            const { id, itemId } = req.params;
            const userId = req.user.id;

            const list = await this.listsDb.findOne({ id, userId });
            if (!list) {
                return res.status(404).json({ success: false, message: 'Lista não encontrada' });
            }

            const initialItemCount = list.items.length;
            const updatedItems = list.items.filter(item => item.itemId !== itemId);

            if (updatedItems.length === initialItemCount) {
                return res.status(404).json({ success: false, message: 'Item não encontrado na lista' });
            }

            const updatedList = await this.listsDb.update(id, {
                items: updatedItems,
                updatedAt: new Date().toISOString()
            });
            
            this.updateListSummary(updatedList);
            
            res.json({ success: true, message: 'Item removido da lista', data: updatedList });
        } catch (error) {
            console.error('Erro ao remover item:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }
    
    async getListSummary(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const list = await this.listsDb.findOne({ id, userId });
            if (!list) {
                return res.status(404).json({ success: false, message: 'Lista não encontrada' });
            }

            // Recalcula o resumo para garantir que está sempre atualizado
            const summary = {
                totalItems: list.items.length,
                purchasedItems: list.items.filter(item => item.purchased).length,
                estimatedTotal: list.items.reduce((total, item) => {
                    const price = item.estimatedPrice || 0;
                    const quantity = item.quantity || 1;
                    return total + (price * quantity);
                }, 0)
            };

            res.json({ success: true, data: summary });
        } catch (error) {
            console.error('Erro ao buscar resumo da lista:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }
    
    // Helper function to update the summary field in the database
    async updateListSummary(list) {
        try {
            const summary = {
                totalItems: list.items.length,
                purchasedItems: list.items.filter(item => item.purchased).length,
                estimatedTotal: list.items.reduce((total, item) => {
                    const price = item.estimatedPrice || 0;
                    const quantity = item.quantity || 1;
                    return total + (price * quantity);
                }, 0)
            };
            
            await this.listsDb.update(list.id, { summary });
        } catch (error) {
            console.error('Erro ao atualizar o resumo da lista:', error);
        }
    }

    registerWithRegistry() {
        serviceRegistry.register(this.serviceName, {
            url: this.serviceUrl,
            version: '1.0.0',
            database: 'JSON-NoSQL',
            endpoints: [
                '/health', '/lists', '/lists/:id', '/lists/:id/items',
                '/lists/:id/items/:itemId', '/lists/:id/summary'
            ]
        });
    }

    startHealthReporting() {
        setInterval(() => {
            serviceRegistry.updateHealth(this.serviceName, true);
        }, 30000);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('=====================================');
            console.log(`List Service iniciado na porta ${this.port}`);
            console.log(`URL: ${this.serviceUrl}`);
            console.log(`Health: ${this.serviceUrl}/health`);
            console.log(`Database: JSON-NoSQL`);
            console.log('=====================================');
            
            this.registerWithRegistry();
            this.startHealthReporting();
        });
    }
}

if (require.main === module) {
    const listService = new ListService();
    listService.start();

    process.on('SIGTERM', () => {
        serviceRegistry.unregister('list-service');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        serviceRegistry.unregister('list-service');
        process.exit(0);
    });
}

module.exports = ListService;