const pool = require('../database/config');

exports.createPost = async (req, res) => {
    const { groupId } = req.params;
    const { content } = req.body;

    try {
        // Verify user is a member of the group
        const [members] = await pool.query('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, req.user.id]);
        if (members.length === 0) {
            return res.status(403).json({ message: 'You must be a member of the group to post.' });
        }

        const [result] = await pool.query(
            'INSERT INTO group_posts (group_id, user_id, content) VALUES (?, ?, ?)',
            [groupId, req.user.id, content]
        );

        res.status(201).json({ message: 'Post created successfully', postId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating post.' });
    }
};

exports.getPostsByGroup = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [posts] = await pool.query(
            `SELECT p.*, u.name AS author_name 
             FROM group_posts p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.group_id = ? 
             ORDER BY p.created_at DESC`,
            [groupId]
        );
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching posts.' });
    }
};
