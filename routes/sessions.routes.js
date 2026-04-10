const express = require('express');
const router = express.Router({ mergeParams: true });
const sessionsController = require('../controllers/sessions.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Route is /api/groups/:groupId/sessions
router.get('/', sessionsController.getSessionsByGroup);
router.post('/', sessionsController.createSession);

module.exports = router;
