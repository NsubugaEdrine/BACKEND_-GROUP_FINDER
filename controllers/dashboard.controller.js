const pool = require('../database/config');

exports.getStudentDashboard = async (req, res) => {
    try {
        // Get groups the student belongs to
        const [myGroups] = await pool.query(
            `SELECT g.* FROM study_groups g 
             JOIN group_members gm ON g.id = gm.group_id 
             WHERE gm.user_id = ?`, 
            [req.user.id]
        );

        // Get upcoming sessions for groups the student is in
        const [upcomingSessions] = await pool.query(
            `SELECT s.*, g.name AS group_name 
             FROM study_sessions s 
             JOIN group_members gm ON s.group_id = gm.group_id 
             JOIN study_groups g ON s.group_id = g.id
             WHERE gm.user_id = ? AND s.session_date >= CURDATE()
             ORDER BY s.session_date ASC, s.session_time ASC
             LIMIT 5`,
            [req.user.id]
        );

        // Get recently created groups globally (for discovery)
        const [recentGroups] = await pool.query(
            `SELECT * FROM study_groups 
             ORDER BY created_at DESC 
             LIMIT 5`
        );

        res.json({
            myGroups,
            upcomingSessions,
            recentGroups
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching student dashboard data.' });
    }
};

exports.getAdminDashboard = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
        const [[{ totalGroups }]] = await pool.query('SELECT COUNT(*) AS totalGroups FROM study_groups');

        const [mostActiveCourses] = await pool.query(`
            SELECT course, COUNT(*) AS groupCount 
            FROM study_groups 
            GROUP BY course 
            ORDER BY groupCount DESC 
            LIMIT 5
        `);

        res.json({
            stats: {
                totalUsers,
                totalGroups
            },
            mostActiveCourses
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching admin dashboard data.' });
    }
};
