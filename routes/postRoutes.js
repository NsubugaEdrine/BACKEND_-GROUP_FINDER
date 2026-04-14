const express = require('express');
const router = express.Router();
const { Post, User, GroupMember } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// Create a post
router.post('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    // Verify membership
    const membership = await GroupMember.findOne({ where: { GroupId: req.params.groupId, UserId: req.user.id } });
    if (!membership) return res.status(403).json({ error: 'Blocked: Must be a group member' });

    const post = await Post.create({
      groupId: req.params.groupId,
      userId: req.user.id,
      content
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating post' });
  }
});

// Get posts
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.findAll({ 
      where: { groupId: req.params.groupId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching posts' });
  }
});

module.exports = router;
