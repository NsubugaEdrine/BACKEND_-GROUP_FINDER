const pool = require('../database/config');

exports.createSession = async (req, res) => {
    const { groupId } = req.params;
    const { session_date, session_time, location_link, description } = req.body;

    try {
        // Verify user is group leader
        const [groups] = await pool.query('SELECT creator_id FROM study_groups WHERE id = ?', [groupId]);
        if (groups.length === 0) return res.status(404).json({ message: 'Group not found.' });

        if (groups[0].creator_id !== req.user.id) {
            return res.status(403).json({ message: 'Only the group leader can create study sessions.' });
        }

        const [result] = await pool.query(
            'INSERT INTO study_sessions (group_id, session_date, session_time, location_link, description, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [groupId, session_date, session_time, location_link, description, req.user.id]
        );

        res.status(201).json({ message: 'Study session created successfully', sessionId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating session.' });
    }
};

exports.getSessionsByGroup = async (req, res) => {
    const { groupId } = req.params;
    try {
        const [sessions] = await pool.query(
            'SELECT s.*, u.name AS creator_name FROM study_sessions s JOIN users u ON s.created_by = u.id WHERE s.group_id = ? ORDER BY s.session_date ASC, s.session_time ASC',
            [groupId]
        );
        res.json(sessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching sessions.' });
    }
};
