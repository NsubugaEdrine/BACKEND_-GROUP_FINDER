const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, program_of_study, year_of_study, role, admin_signup_code } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const normalizedRole = String(role || 'STUDENT').toUpperCase();
    const allowedRoles = ['STUDENT', 'ADMIN'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    // Safeguard: admin accounts can be created by existing admins
    // or with a valid admin signup code configured on the server.
    if (normalizedRole === 'ADMIN') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      let isExistingAdmin = false;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          isExistingAdmin = decoded.role === 'ADMIN';
        } catch (error) {
          isExistingAdmin = false;
        }
      }

      const expectedAdminCode = process.env.ADMIN_SIGNUP_CODE;
      const isValidAdminCode = Boolean(expectedAdminCode) && admin_signup_code === expectedAdminCode;

      if (!isExistingAdmin && !isValidAdminCode) {
        return res.status(403).json({ error: 'Admin signup requires existing admin access or valid admin signup code' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      program_of_study,
      year_of_study,
      role: normalizedRole
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'program_of_study', 'year_of_study']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

module.exports = router;
