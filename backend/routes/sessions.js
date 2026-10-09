const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');
const { transformSession } = require('../utils/transform');

async function fetchSessions(connection, includeAll) {
  const where = includeAll
    ? 's.deleted_at IS NULL'
    : 's.status = "published" AND s.deleted_at IS NULL';

  const [sessions] = await connection.query(
    `SELECT s.*, sp.full_name AS speaker_name, sh.full_name AS host_name,
            GROUP_CONCAT(st.theme_id ORDER BY st.theme_id SEPARATOR ',') AS theme_ids
     FROM sessions s
     LEFT JOIN speakers sp ON s.speaker_id = sp.id
     LEFT JOIN speakers sh ON s.host_id = sh.id
     LEFT JOIN session_themes st ON s.id = st.session_id
     WHERE ${where}
     GROUP BY s.id
     ORDER BY s.session_number DESC`
  );

  return sessions.map(row => {
    const themeIds = row.theme_ids ? row.theme_ids.split(',') : [];
    return transformSession(row, themeIds);
  });
}

function canViewAll(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return ['admin', 'curator', 'editor'].includes(decoded.role);
  } catch {
    return false;
  }
}

router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const sessions = await fetchSessions(connection, canViewAll(req));
    connection.release();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [sessions] = await connection.query(
      `SELECT s.*, sp.full_name AS speaker_name, sh.full_name AS host_name
       FROM sessions s
       LEFT JOIN speakers sp ON s.speaker_id = sp.id
       LEFT JOIN speakers sh ON s.host_id = sh.id
       WHERE s.id = ? AND s.deleted_at IS NULL`,
      [req.params.id]
    );

    if (sessions.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Session not found' });
    }

    const [themes] = await connection.query(
      'SELECT theme_id FROM session_themes WHERE session_id = ?',
      [req.params.id]
    );
    connection.release();

    const themeIds = themes.map(t => t.theme_id);
    res.json(transformSession(sessions[0], themeIds));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
