const pool = require('../database/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// User Registration
exports.register = async (req, res) => {
    const { name, email, password, program_of_study, year_of_study } = req.body;

    try {
        // Check if user already exists
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, program_of_study, year_of_study) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, program_of_study, year_of_study]
        );

        // Generate JWT
        const token = jwt.sign(
            { id: result.insertId, role: 'student' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: result.insertId, name, email, program_of_study, year_of_study, role: 'student' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// User Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Logged in successfully',
            token,
            user: { id: user.id, name: user.name, email: user.email, program_of_study: user.program_of_study, year_of_study: user.year_of_study, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Get current logged-in user
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, program_of_study, year_of_study, role FROM users WHERE id = ?', 
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching user.' });
    }
};
