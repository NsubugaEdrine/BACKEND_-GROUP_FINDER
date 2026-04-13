const express = require('express');
const router = express.Router();
const { ChatMessage, User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const room = req.query.room || 'global';
    const parsedLimit = Number(req.query.limit || 100);
    const limit = Number.isNaN(parsedLimit) ? 100 : Math.max(1, Math.min(parsedLimit, 200));

    const messages = await ChatMessage.findAll({
      where: { room },
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'ASC']],
      limit
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching chat messages' });
  }
});

router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { content, room } = req.body;
    const text = String(content || '').trim();
    if (!text) return res.status(400).json({ error: 'Message content is required' });

    const message = await ChatMessage.create({
      room: String(room || 'global'),
      content: text,
      userId: req.user.id
    });

    const created = await ChatMessage.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }]
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Server error sending chat message' });
  }
});

module.exports = router;
