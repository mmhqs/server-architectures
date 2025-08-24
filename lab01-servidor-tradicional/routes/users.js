const express = require('express');
require('uuid');
const User = require('../models/User');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const router = express.Router();

// Todas as rotas abaixo requerem autenticação
router.use(authMiddleware);

/**
 * Retrieves the profile information for the authenticated user.
 *
 * This route fetches the user's details from the database based on their authentication token.
 * It provides a way for a user to view their own data.
 *
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} req.user - O objeto do usuário autenticado fornecido pelo middleware.
 * @param {object} res - O objeto de resposta do Express.
 * @returns {object} O objeto de resposta com os dados do usuário.
 */
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


/**
 * Updates the authenticated user's profile.
 *
 * This route allows a user to update their own email, username, first name, and last name.
 * It uses the authenticated user's ID to ensure they are modifying their own data.
 *
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} req.user - O objeto do usuário autenticado fornecido pelo middleware.
 * @param {object} req.body - O objeto do corpo da requisição com os dados do usuário a serem atualizados.
 * @param {object} res - O objeto de resposta do Express.
 * @returns {object} O objeto de resposta com uma mensagem de sucesso e os dados atualizados do usuário.
 */
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

/**
 * Deletes the authenticated user's account and all associated tasks.
 *
 * This route performs a cascade delete, first removing all tasks belonging to the user
 * to maintain database integrity, and then deleting the user's record.
 *
 * @param {object} req - O objeto de requisição do Express.
 * @param {object} req.user - O objeto do usuário autenticado fornecido pelo middleware.
 * @param {object} res - O objeto de resposta do Express.
 * @returns {object} O objeto de resposta com uma mensagem de sucesso.
 */
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