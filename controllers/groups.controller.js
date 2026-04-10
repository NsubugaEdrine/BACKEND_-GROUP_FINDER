const pool = require('../database/config');

exports.createGroup = async (req, res) => {
    const { name, course, description, meeting_location } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO study_groups (name, course, description, meeting_location, creator_id) VALUES (?, ?, ?, ?, ?)',
            [name, course, description, meeting_location, req.user.id]
        );
        const groupId = result.insertId;

        // Automatically add creator to group_members
        await pool.query(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [groupId, req.user.id]
        );

        res.status(201).json({ message: 'Study group created successfully', groupId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating study group.' });
    }
};

exports.getAllGroups = async (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count FROM study_groups g';
        let params = [];

        if (search) {
            query += ' WHERE g.name LIKE ? OR g.course LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY g.created_at DESC';

        const [groups] = await pool.query(query, params);
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching groups.' });
    }
};

exports.getGroupById = async (req, res) => {
    const { id } = req.params;
    try {
        const [groups] = await pool.query('SELECT * FROM study_groups WHERE id = ?', [id]);
        if (groups.length === 0) return res.status(404).json({ message: 'Group not found.' });

        // Get members
        const [members] = await pool.query(
            `SELECT u.id, u.name, u.role, gm.joined_at 
             FROM group_members gm 
             JOIN users u ON gm.user_id = u.id 
             WHERE gm.group_id = ?`, [id]
        );

        res.json({ ...groups[0], members });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching group.' });
    }
};

exports.joinGroup = async (req, res) => {
    const { id } = req.params;
    try {
        // check if already a member
        const [existing] = await pool.query('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [id, req.user.id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'You are already a member of this group.' });
        }
        await pool.query('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [id, req.user.id]);
        res.json({ message: 'Joined group successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error joining group.' });
    }
};

exports.leaveGroup = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [id, req.user.id]);
        res.json({ message: 'Left group successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error leaving group.' });
    }
};

exports.removeMember = async (req, res) => {
    const { id, userId } = req.params;
    try {
        // Verify req.user is the creator
        const [groups] = await pool.query('SELECT creator_id FROM study_groups WHERE id = ?', [id]);
        if (groups.length === 0) return res.status(404).json({ message: 'Group not found.' });
        
        if (groups[0].creator_id !== req.user.id) {
            return res.status(403).json({ message: 'Only the group leader can remove members.' });
        }

        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'You cannot remove yourself as group leader.' });
        }

        await pool.query('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Member removed successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error removing member.' });
    }
};

exports.updateGroup = async (req, res) => {
    const { id } = req.params;
    const { name, course, description, meeting_location } = req.body;
    try {
        // Verify req.user is the creator
        const [groups] = await pool.query('SELECT creator_id FROM study_groups WHERE id = ?', [id]);
        if (groups.length === 0) return res.status(404).json({ message: 'Group not found.' });
        
        if (groups[0].creator_id !== req.user.id) {
            return res.status(403).json({ message: 'Only the group leader can update group details.' });
        }

        await pool.query(
            'UPDATE study_groups SET name = ?, course = ?, description = ?, meeting_location = ? WHERE id = ?',
            [name, course, description, meeting_location, id]
        );

        res.json({ message: 'Group updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating group.' });
    }
};
