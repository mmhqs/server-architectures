const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios');
const JsonDatabase = require('../../shared/JsonDatabase');
const serviceRegistry = require('../../shared/serviceRegistry');

class ItemService {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3003;
        this.serviceName = 'item-service';
        this.serviceUrl = `http://127.0.0.1:${this.port}`;

        this.setupDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.seedInitialData();
    }

    setupDatabase() {
        const dbPath = path.join(__dirname, 'database');
        this.itemsDb = new JsonDatabase(dbPath, 'items');
        console.log('Item Service: Banco NoSQL inicializado');
    }

    async seedInitialData() {
        // Aguardar inicialização e criar produtos exemplo
        setTimeout(async () => {
            try {
                const existingItems = await this.itemsDb.find();

                if (existingItems.length === 0) {
                    [
                        {
                            "id": "e6f4a8d0-2f3b-4c1a-8e9d-0b7c5a9d2f3e",
                            "name": "Arroz Branco",
                            "category": "Alimentos",
                            "brand": "Camil",
                            "unit": "kg",
                            "averagePrice": 5.99,
                            "barcode": "7891234567890",
                            "description": "Arroz branco tipo 1, pacote de 1kg.",
                            "active": true,
                            "createdAt": "2025-09-21T10:00:00Z"
                        },
                        {
                            "id": "f8a7c2b5-4e6d-4f8a-9c0b-1d2e3f4a5b6c",
                            "name": "Sabão em Pó",
                            "category": "Limpeza",
                            "brand": "OMO",
                            "unit": "kg",
                            "averagePrice": 15.50,
                            "barcode": "7890987654321",
                            "description": "Sabão em pó para roupas, embalagem de 1kg.",
                            "active": true,
                            "createdAt": "2025-09-21T10:05:00Z"
                        },
                        {
                            "id": "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
                            "name": "Shampoo",
                            "category": "Higiene",
                            "brand": "Seda",
                            "unit": "un",
                            "averagePrice": 12.00,
                            "barcode": "7896543210987",
                            "description": "Shampoo para todos os tipos de cabelo, 325ml.",
                            "active": true,
                            "createdAt": "2025-09-21T10:10:00Z"
                        },
                        {
                            "id": "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
                            "name": "Refrigerante Cola",
                            "category": "Bebidas",
                            "brand": "Coca-Cola",
                            "unit": "litro",
                            "averagePrice": 8.90,
                            "barcode": "7898765432109",
                            "description": "Refrigerante de cola, garrafa de 2 litros.",
                            "active": true,
                            "createdAt": "2025-09-21T10:15:00Z"
                        },
                        {
                            "id": "5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
                            "name": "Pão de Forma",
                            "category": "Padaria",
                            "brand": "Pullman",
                            "unit": "un",
                            "averagePrice": 7.50,
                            "barcode": "7890123456789",
                            "description": "Pão de forma tradicional, 500g.",
                            "active": true,
                            "createdAt": "2025-09-21T10:20:00Z"
                        },
                        {
                            "id": "7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c",
                            "name": "Feijão Preto",
                            "category": "Alimentos",
                            "brand": "Kicaldo",
                            "unit": "kg",
                            "averagePrice": 8.20,
                            "barcode": "7891122334455",
                            "description": "Feijão preto, pacote de 1kg.",
                            "active": true,
                            "createdAt": "2025-09-21T10:25:00Z"
                        },
                        {
                            "id": "9d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a",
                            "name": "Detergente de Cozinha",
                            "category": "Limpeza",
                            "brand": "Ypê",
                            "unit": "un",
                            "averagePrice": 2.99,
                            "barcode": "7892233445566",
                            "description": "Detergente líquido de cozinha, 500ml.",
                            "active": true,
                            "createdAt": "2025-09-21T10:30:00Z"
                        },
                        {
                            "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
                            "name": "Pasta de Dente",
                            "category": "Higiene",
                            "brand": "Colgate",
                            "unit": "un",
                            "averagePrice": 4.50,
                            "barcode": "7893344556677",
                            "description": "Pasta de dente com flúor, 90g.",
                            "active": true,
                            "createdAt": "2025-09-21T10:35:00Z"
                        },
                        {
                            "id": "2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
                            "name": "Suco de Laranja",
                            "category": "Bebidas",
                            "brand": "Del Valle",
                            "unit": "litro",
                            "averagePrice": 6.80,
                            "barcode": "7894455667788",
                            "description": "Suco de laranja pronto para beber, caixa de 1 litro.",
                            "active": true,
                            "createdAt": "2025-09-21T10:40:00Z"
                        },
                        {
                            "id": "3b4c5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e",
                            "name": "Bolo de Cenoura",
                            "category": "Padaria",
                            "brand": "Vovó Juju",
                            "unit": "un",
                            "averagePrice": 15.00,
                            "barcode": "7895566778899",
                            "description": "Bolo de cenoura com cobertura de chocolate, 500g.",
                            "active": true,
                            "createdAt": "2025-09-21T10:45:00Z"
                        },
                        {
                            "id": "4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f",
                            "name": "Leite Integral",
                            "category": "Alimentos",
                            "brand": "Nestlé",
                            "unit": "litro",
                            "averagePrice": 4.50,
                            "barcode": "7896677889900",
                            "description": "Leite integral UHT, caixa de 1 litro.",
                            "active": true,
                            "createdAt": "2025-09-21T10:50:00Z"
                        },
                        {
                            "id": "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b",
                            "name": "Água Sanitária",
                            "category": "Limpeza",
                            "brand": "Cândida",
                            "unit": "litro",
                            "averagePrice": 5.90,
                            "barcode": "7897788990011",
                            "description": "Água sanitária para desinfecção e limpeza geral, 1 litro.",
                            "active": true,
                            "createdAt": "2025-09-21T10:55:00Z"
                        },
                        {
                            "id": "6d7e8f9a-0b1c-2d3e-4f5a-6b7c8d9e0f1a",
                            "name": "Sabonete Líquido",
                            "category": "Higiene",
                            "brand": "Protex",
                            "unit": "un",
                            "averagePrice": 8.75,
                            "barcode": "7898899001122",
                            "description": "Sabonete líquido antibacteriano, 250ml.",
                            "active": true,
                            "createdAt": "2025-09-21T11:00:00Z"
                        },
                        {
                            "id": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
                            "name": "Cerveja Pilsen",
                            "category": "Bebidas",
                            "brand": "Heineken",
                            "unit": "un",
                            "averagePrice": 4.50,
                            "barcode": "7899900112233",
                            "description": "Cerveja Pilsen, garrafa long neck, 330ml.",
                            "active": true,
                            "createdAt": "2025-09-21T11:05:00Z"
                        },
                        {
                            "id": "8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e",
                            "name": "Rosquinhas de Coco",
                            "category": "Padaria",
                            "brand": "Mabel",
                            "unit": "un",
                            "averagePrice": 3.99,
                            "barcode": "7891122334466",
                            "description": "Rosquinhas com sabor de coco, pacote de 115g.",
                            "active": true,
                            "createdAt": "2025-09-21T11:10:00Z"
                        },
                        {
                            "id": "9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
                            "name": "Café em Pó",
                            "category": "Alimentos",
                            "brand": "Pilão",
                            "unit": "kg",
                            "averagePrice": 18.00,
                            "barcode": "7892233445577",
                            "description": "Café torrado e moído, embalagem a vácuo de 500g.",
                            "active": true,
                            "createdAt": "2025-09-21T11:15:00Z"
                        },
                        {
                            "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
                            "name": "Esponja de Limpeza",
                            "category": "Limpeza",
                            "brand": "Scotch-Brite",
                            "unit": "un",
                            "averagePrice": 2.50,
                            "barcode": "7893344556688",
                            "description": "Esponja multiuso para limpeza pesada.",
                            "active": true,
                            "createdAt": "2025-09-21T11:20:00Z"
                        },
                        {
                            "id": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
                            "name": "Fio Dental",
                            "category": "Higiene",
                            "brand": "Oral-B",
                            "unit": "un",
                            "averagePrice": 6.90,
                            "barcode": "7894455667799",
                            "description": "Fio dental com 50 metros.",
                            "active": true,
                            "createdAt": "2025-09-21T11:25:00Z"
                        },
                        {
                            "id": "c3d4e5f6-a7b8-c9d0-e1f2-a3b4c5d6e7f8",
                            "name": "Água Mineral",
                            "category": "Bebidas",
                            "brand": "Bonafont",
                            "unit": "litro",
                            "averagePrice": 1.99,
                            "barcode": "7895566778800",
                            "description": "Água mineral sem gás, garrafa de 500ml.",
                            "active": true,
                            "createdAt": "2025-09-21T11:30:00Z"
                        },
                        {
                            "id": "d4e5f6a7-b8c9-d0e1-f2a3-b4c5d6e7f8a9",
                            "name": "Biscoito de Polvilho",
                            "category": "Padaria",
                            "brand": "Mocinho",
                            "unit": "un",
                            "averagePrice": 4.20,
                            "barcode": "7896677889911",
                            "description": "Biscoito de polvilho, pacote de 100g.",
                            "active": true,
                            "createdAt": "2025-09-21T11:35:00Z"
                        }
                    ]

                    for (const item of sampleItems) {
                        await this.itemsDb.create(item);
                    }

                    console.log('Produtos de exemplo criados no Item Service');
                }
            } catch (error) {
                console.error('Erro ao criar dados iniciais:', error);
            }
        }, 1000);
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
        // Health check
        this.app.get('/health', async (req, res) => {
            try {
                const itemCount = await this.itemsDb.count();
                const activeItems = await this.itemsDb.count({ active: true });

                res.json({
                    service: this.serviceName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    version: '1.0.0',
                    database: {
                        type: 'JSON-NoSQL',
                        itemCount: itemCount,
                        activeItems: activeItems
                    }
                });
            } catch (error) {
                res.status(503).json({
                    service: this.serviceName,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // Service info
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Item Service',
                version: '1.0.0',
                description: 'Microsserviço para gerenciamento de produtos com NoSQL',
                database: 'JSON-NoSQL',
                endpoints: [
                    'GET /items',
                    'GET /items/:id',
                    'POST /items',
                    'PUT /items/:id',
                    'GET /search'
                ]
            });
        });

        this.app.get('/items', this.getItems.bind(this));
        this.app.get('/items/:id', this.getItem.bind(this));
        this.app.post('/items', this.authMiddleware.bind(this), this.createItem.bind(this));
        this.app.put('/items/:id', this.authMiddleware.bind(this), this.updateItem.bind(this));
        this.app.get('/search', this.searchItems.bind(this));
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
            console.error('Item Service Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do serviço',
                service: this.serviceName
            });
        });
    }

    // Auth middleware (valida token com User Service)
    async authMiddleware(req, res, next) {
        const authHeader = req.header('Authorization');

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token obrigatório'
            });
        }

        try {
            // Descobrir User Service
            const userService = serviceRegistry.discover('user-service');

            // Validar token com User Service
            const response = await axios.post(`${userService.url}/auth/validate`, {
                token: authHeader.replace('Bearer ', '')
            }, { timeout: 5000 });

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

    async getItems(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                minPrice,
                maxPrice,
                search,
                active = true,
            } = req.query;

            const skip = (page - 1) * parseInt(limit);

            const filter = { active: active === 'true' };

            if (category) {
                filter['category.slug'] = category;
            }

            if (minPrice) {
                filter.averagePrice = { $gte: parseFloat(minPrice) };
            }
            if (maxPrice) {
                if (filter.averagePrice) {
                    filter.averagePrice.$lte = parseFloat(maxPrice);
                } else {
                    filter.averagePrice = { $lte: parseFloat(maxPrice) };
                }
            }

            let items;

            // Se há busca por texto, usar método de search
            if (search) {
                items = await this.itemsDb.search(search, ['name', 'description']);
                // Aplicar outros filtros manualmente
                items = items.filter(item => {
                    for (const [key, value] of Object.entries(filter)) {
                        if (key === 'averagePrice') {
                            if (value.$gte && item.averagePrice < value.$gte) return false;
                            if (value.$lte && item.averagePrice > value.$lte) return false;
                        } else if (key.includes('.')) {
                            // Campos aninhados (ex: category.slug)
                            const keys = key.split('.');
                            const itemValue = keys.reduce((obj, k) => obj?.[k], item);
                            if (itemValue !== value) return false;
                        } else if (item[key] !== value) {
                            return false;
                        }
                    }
                    return true;
                });
                // Aplicar paginação manual
                items = items.slice(skip, skip + parseInt(limit));
            } else {
                items = await this.itemsDb.find(filter, {
                    skip: skip,
                    limit: parseInt(limit),
                    sort: { createdAt: -1 }
                });
            }

            const total = await this.itemsDb.count(filter);

            res.json({
                success: true,
                data: items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }


    async getItem(req, res) {
        try {
            const { id } = req.params;
            const item = await this.itemsDb.findById(id);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    async createItem(req, res) {
        try {
            const {
                name,
                category,
                brand,
                unit,
                averagePrice,
                description,
            } = req.body;

            if (!name || !averagePrice) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome e preço são obrigatórios'
                });
            }

            const newItem = await this.itemsDb.create({
                id: uuidv4(),
                name,
                category: category || { name: 'Geral', slug: 'geral' },
                brand: brand,
                unit: unit,
                averagePrice: parseFloat(averagePrice),
                barcode: 345983479587395837,
                description: description || '',
                active: true,
                createdAt: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Produto criado com sucesso',
                data: newItem
            });
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    async updateItem(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                averagePrice,
                category,
                active,
            } = req.body;

            const item = await this.itemsDb.findById(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (averagePrice !== undefined) updates.averagePrice = parseFloat(averagePrice);
            if (category !== undefined) updates.category = category;
            if (active !== undefined) updates.active = active;

            const updatedItem = await this.itemsDb.update(id, updates);

            res.json({
                success: true,
                message: 'Produto atualizado com sucesso',
                data: updatedItem
            });
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    async searchItems(req, res) {
        try {
            const { q, limit = 20, category } = req.query;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro de busca "q" é obrigatório'
                });
            }

            // Busca full-text NoSQL
            let items = await this.itemsDb.search(q, ['name', 'description']);

            // Filtrar apenas produtos ativos
            items = items.filter(item => item.active);

            // Filtrar por categoria se especificada
            if (category) {
                items = items.filter(item =>
                    item.category?.slug === category || item.category?.name === category
                );
            }

            // Aplicar limite
            items = items.slice(0, parseInt(limit));

            res.json({
                success: true,
                data: {
                    query: q,
                    category: category || null,
                    results: items,
                    total: items.length
                }
            });
        } catch (error) {
            console.error('Erro na busca de produtos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }

    registerWithRegistry() {
        serviceRegistry.register(this.serviceName, {
            url: this.serviceUrl,
            version: '1.0.0',
            database: 'JSON-NoSQL',
            endpoints: ['/health', '/items', '/categories', '/search']
        });
    }

    // Start health check reporting
    startHealthReporting() {
        setInterval(() => {
            serviceRegistry.updateHealth(this.serviceName, true);
        }, 30000);
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('=====================================');
            console.log(`Item Service iniciado na porta ${this.port}`);
            console.log(`URL: ${this.serviceUrl}`);
            console.log(`Health: ${this.serviceUrl}/health`);
            console.log(`Database: JSON-NoSQL`);
            console.log('=====================================');

            // Register with service registry
            this.registerWithRegistry();
            this.startHealthReporting();
        });
    }
}

// Start service
if (require.main === module) {
    const itemService = new ItemService();
    itemService.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        serviceRegistry.unregister('item-service');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        serviceRegistry.unregister('item-service');
        process.exit(0);
    });
}

module.exports = ItemService;