const express = require('express');
const router = express.Router();
const groupsController = require('../controllers/groups.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware); // All group routes protected

router.get('/', groupsController.getAllGroups);
router.post('/', groupsController.createGroup);
router.get('/:id', groupsController.getGroupById);
router.put('/:id', groupsController.updateGroup);
router.post('/:id/join', groupsController.joinGroup);
router.post('/:id/leave', groupsController.leaveGroup);
router.delete('/:id/members/:userId', groupsController.removeMember);

module.exports = router;
