const express = require('express');
require('uuid');
const User = require('../models/User');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const router = express.Router();

// Todas as rotas abaixo requerem autenticação
router.use(authMiddleware);

router.get('/me', async (req, res) => {
    try {
        const userData = await database.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        const user = new User(userData);
        res.json({
            success: true,
            data: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.put('/me', validate('userUpdate'), async (req, res) => {
    try {
        const { email, username, firstName, lastName } = req.body;

        const result = await database.run(
            'UPDATE users SET email = ?, username = ?, firstName = ?, lastName = ? WHERE id = ?',
            [email, username, firstName, lastName, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        const updatedUser = await database.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const user = new User(updatedUser);
        
        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso',
            data: user.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

router.delete('/me', async (req, res) => {
    try {
        // Deletar as tarefas associadas ao usuário primeiro
        await database.run('DELETE FROM tasks WHERE userId = ?', [req.user.id]);

        // Agora, deletar o usuário
        const result = await database.run('DELETE FROM users WHERE id = ?', [req.user.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        res.json({
            success: true,
            message: 'Usuário e suas tarefas deletados com sucesso'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;