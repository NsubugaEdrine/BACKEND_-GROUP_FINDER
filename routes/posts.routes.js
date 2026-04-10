const express = require('express');
const router = express.Router({ mergeParams: true });
const postsController = require('../controllers/posts.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Route is /api/groups/:groupId/posts
router.get('/', postsController.getPostsByGroup);
router.post('/', postsController.createPost);

module.exports = router;
