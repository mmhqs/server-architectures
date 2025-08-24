const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const database = require('../database/database');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * Handles user registration.
 *
 * This route validates user input, checks for existing users,
 * hashes the password, and creates a new user in the database.
 * It returns a JWT for authentication.
 *
 * @param {object} req - The Express request object.
 * @returns {object} The response object with user data and a token.
 */
router.post('/register', validate('register'), async (req, res) => {
    try {
        const { email, username, password, firstName, lastName } = req.body;

        // Verificar se usuário já existe
        const existingUser = await database.get(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email ou username já existe'
            });
        }

        const userData = { id: uuidv4(), email, username, password, firstName, lastName };
        const user = new User(userData);
        await user.hashPassword();

        await database.run(
            'INSERT INTO users (id, email, username, password, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, user.email, user.username, user.password, user.firstName, user.lastName]
        );

        const token = user.generateToken();

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

/**
 * Handles user login.
 *
 * This route authenticates a user by checking their credentials
 * against the database. It returns a JWT for subsequent API requests.
 *
 * @param {object} req - The Express request object.
 * @returns {object} The response object with user data and a token.
 */
router.post('/login', validate('login'), async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const userData = await database.get(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [identifier, identifier]
        );

        if (!userData) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const user = new User(userData);
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const token = user.generateToken();

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;