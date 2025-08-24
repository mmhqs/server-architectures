const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const router = express.Router();
const limiter = require('../middleware/rateLimiter');

// Aplica a autenticação e o rate limiting para todas as rotas de tasks
router.use(authMiddleware);
router.use(limiter);

/**
 * Retrieves a paginated list of tasks for the authenticated user.
 *
 * This route allows filtering by task completion status and priority.
 * It uses in-memory caching to optimize performance for frequent requests.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {object} The response object containing a list of tasks and pagination metadata.
 */
router.get('/', async (req, res) => {
    try {
        // Tenta obter os dados do cache
        const cachedTasks = cache.get(req);
        if (cachedTasks) {
            return res.json({
                success: true,
                data: cachedTasks,
                fromCache: true // Sinaliza que a resposta veio do cache
            });
        }
        
        // Se não houver cache, continua com a consulta ao DB
        const { completed, priority } = req.query;

        // 1. Obter os parâmetros de paginação com valores padrão
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;

        // 2. Calcular o offset
        const offset = (page - 1) * limit;

        // Construir a consulta SQL
        let sql = 'SELECT * FROM tasks WHERE userId = ?';
        const params = [req.user.id];

        if (completed !== undefined) {
            sql += ' AND completed = ?';
            params.push(completed === 'true' ? 1 : 0);
        }
        
        if (priority) {
            sql += ' AND priority = ?';
            params.push(priority);
        }

        sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';

        // 3. Adicionar os parâmetros de limite e offset
        params.push(limit, offset);

        const rows = await database.all(sql, params);
        const tasks = rows.map(row => new Task({...row, completed: row.completed === 1}));

        // Passo 3: Depois de obter os dados do banco, armazena o resultado no cache.
        cache.set(req, tasks.map(task => task.toJSON()));

        // Log estruturado de sucesso
        logger.info('Tarefas listadas com sucesso', {
            userId: req.user.id,
            page: page,
            limit: limit
        });

        res.json({
            success: true,
            data: tasks.map(task => task.toJSON()),
            pagination: {
                page,
                limit
            }
        });
    } catch (error) {
        // Log de erro estruturado
        logger.error('Erro ao listar tarefas', {
            userId: req.user.id,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * Creates a new task for the authenticated user.
 *
 * This route validates the request body, assigns a unique ID,
 * and saves the new task to the database. It also invalidates the
 * task list cache to ensure data freshness.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @returns {object} The response object with a success message and the created task's data.
 */
router.post('/', validate('task'), async (req, res) => {
    try {
        const taskData = { 
            id: uuidv4(), 
            ...req.body, 
            userId: req.user.id 
        };
        
        const task = new Task(taskData);
        const validation = task.validate();
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: validation.errors
            });
        }

        await database.run(
            'INSERT INTO tasks (id, title, description, priority, userId) VALUES (?, ?, ?, ?, ?)',
            [task.id, task.title, task.description, task.priority, task.userId]
        );

        // Invalida o cache da listagem de tarefas após a criação
        cache.invalidateAll();

        res.status(201).json({
            success: true,
            message: 'Tarefa criada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * Retrieves a single task by its ID for the authenticated user.
 *
 * This route fetches a specific task from the database using its unique ID.
 * It ensures the task belongs to the authenticated user.
 *
 * @param {object} req - The Express request object.
 * @param {object} req.user - The authenticated user object from the middleware.
 * @param {string} req.params.id - The unique ID of the task to retrieve.
 * @param {object} res - The Express response object.
 * @returns {object} The response object containing the task's data.
 */
router.get('/:id', async (req, res) => {
    try {
        const row = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const task = new Task({...row, completed: row.completed === 1});
        res.json({
            success: true,
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * Updates an existing task for the authenticated user by ID.
 *
 * This route allows updating the title, description, completion status, and priority of a task.
 * It ensures the task belongs to the authenticated user and invalidates the cache after a successful update.
 *
 * @param {object} req - The Express request object.
 * @param {object} req.user - The authenticated user object from the middleware.
 * @param {string} req.params.id - The unique ID of the task to update.
 * @param {object} req.body - The request body with the updated task data.
 * @param {object} res - The Express response object.
 * @returns {object} The response object with a success message and the updated task's data.
 */
router.put('/:id', async (req, res) => {
    try {
        const { title, description, completed, priority } = req.body;
        
        const result = await database.run(
            'UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ? WHERE id = ? AND userId = ?',
            [title, description, completed ? 1 : 0, priority, req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const updatedRow = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        const task = new Task({...updatedRow, completed: updatedRow.completed === 1});

        // Invalida o cache da listagem de tarefas após a criação
        cache.invalidateAll();
        
        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * Deletes a task by its ID for the authenticated user.
 *
 * This route permanently removes a task from the database. It ensures
 * the task belongs to the authenticated user and invalidates the task list cache.
 *
 * @param {object} req - The Express request object.
 * @param {object} req.user - The authenticated user object from the middleware.
 * @param {string} req.params.id - The unique ID of the task to delete.
 * @param {object} res - The Express response object.
 * @returns {object} The response object with a success message.
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await database.run(
            'DELETE FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        // Invalida o cache da listagem de tarefas após a criação
        cache.invalidateAll();

        res.json({
            success: true,
            message: 'Tarefa deletada com sucesso'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Estatísticas
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await database.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending
            FROM tasks WHERE userId = ?
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                ...stats,
                completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;