const express = require('express');
const router = express.Router();
const { StudySession, GroupMember } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// Create a session for a specific group
router.post('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { date, time, location, description, topic } = req.body;
    
    // Verify user is part of group
    const membership = await GroupMember.findOne({ where: { GroupId: req.params.groupId, UserId: req.user.id } });
    if (!membership) return res.status(403).json({ error: 'Must be a member to create a session' });

    const session = await StudySession.create({
      groupId: req.params.groupId,
      date, time, location,
      description: topic || description
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating session' });
  }
});

// List sessions for a specific group
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const sessions = await StudySession.findAll({ where: { groupId: req.params.groupId } });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching sessions' });
  }
});

module.exports = router;
