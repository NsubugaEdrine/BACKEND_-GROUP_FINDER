const express = require('express');
const router = express.Router();
const { StudyGroup, GroupMember, User, StudySession, Post, sequelize } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

// Create Group
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, course_name_code, description, location, faculty, maxCapacity, isVirtual } = req.body;
    const group = await StudyGroup.create({
      name,
      course_name_code,
      description,
      location,
      faculty,
      maxCapacity,
      isVirtual
    });

    // Automatically add creator as Leader
    await GroupMember.create({
      groupId: group.id,
      userId: req.user.id,
      role: 'LEADER'
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating group' });
  }
});

router.get('/', async (req, res) => {
  try {
    const groups = await StudyGroup.findAll({
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'role'],
        through: { attributes: ['role'] }
      }]
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching groups' });
  }
});

// Get Single Group
router.get('/:id', async (req, res) => {
  try {
    const group = await StudyGroup.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'name', 'role'],
        through: { attributes: ['role'] }
      }]
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign Group Leader (Admin only)
router.put('/:id/leader/:userId', authMiddleware, async (req, res) => {
  const groupId = Number(req.params.id);
  const userId = Number(req.params.userId);

  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can assign a group leader' });
    }

    const group = await StudyGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const targetUser = await User.findByPk(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.role !== 'STUDENT') {
      return res.status(400).json({ error: 'Only students can be assigned as group leader' });
    }

    const membership = await GroupMember.findOne({ where: { groupId: groupId, userId: userId } });
    if (!membership) {
      return res.status(400).json({ error: 'Selected user must be a member of this group' });
    }

    await sequelize.transaction(async (t) => {
      await GroupMember.update(
        { role: 'MEMBER' },
        { where: { groupId: groupId }, transaction: t }
      );
      await GroupMember.update(
        { role: 'LEADER' },
        { where: { groupId: groupId, userId: userId }, transaction: t }
      );
    });

    return res.json({ message: `${targetUser.name} is now the group leader` });
  } catch (error) {
    return res.status(500).json({ error: 'Server error assigning group leader' });
  }
});

// Join Group
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const group = await StudyGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    await GroupMember.findOrCreate({ 
      where: { groupId: groupId, userId: req.user.id },
      defaults: { role: 'MEMBER' }
    });
    res.json({ message: 'Joined group successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error joining group' });
  }
});

// Remove Member (Leader only)
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const leaderCheck = await GroupMember.findOne({ where: { groupId: req.params.id, userId: req.user.id, role: 'LEADER' }});
    if (!leaderCheck && req.user.id != req.params.userId) return res.status(403).json({ error: 'Only leaders can remove others' });

    await GroupMember.destroy({ where: { groupId: req.params.id, userId: req.params.userId } });
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin feedback: recent student joins
router.get('/feedback/admin/join', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can access join feedback' });
    }

    const joins = await GroupMember.findAll({
      where: { role: 'MEMBER' },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const userIds = [...new Set(joins.map((j) => j.userId).filter(Boolean))];
    const groupIds = [...new Set(joins.map((j) => j.groupId).filter(Boolean))];

    const [users, groups] = await Promise.all([
      User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'program_of_study'] }),
      StudyGroup.findAll({ where: { id: groupIds }, attributes: ['id', 'name', 'course_name_code'] })
    ]);

    const usersById = new Map(users.map((u) => [u.id, u]));
    const groupsById = new Map(groups.map((g) => [g.id, g]));

    const feedback = joins.map((join) => ({
      id: join.id,
      joinedAt: join.createdAt,
      student: usersById.get(join.userId)
        ? {
            id: usersById.get(join.userId).id,
            name: usersById.get(join.userId).name,
            program_of_study: usersById.get(join.userId).program_of_study
          }
        : null,
      group: groupsById.get(join.groupId)
        ? {
            id: groupsById.get(join.groupId).id,
            name: groupsById.get(join.groupId).name,
            course_name_code: groupsById.get(join.groupId).course_name_code
          }
        : null
    }));

    return res.json({ feedback });
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching join feedback' });
  }
});

module.exports = router;
