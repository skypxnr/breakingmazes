const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Helper to format session keys to match frontend expectations
function transformSession(s) {
  if (!s) return null;
  return {
    ...s,
    speakerId: s.speaker_id,
    hostId: s.host_id,
    number: s.session_number,
    poster: s.poster_url,
    youtubeId: s.video_youtube_id,
    duration: s.video_duration,
    isFeatured: s.is_featured
  };
}

router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [sessions] = await connection.query(
      `SELECT s.*, sp.full_name AS speaker_name, sh.full_name AS host_name
       FROM sessions s
       LEFT JOIN speakers sp ON s.speaker_id = sp.id
       LEFT JOIN speakers sh ON s.host_id = sh.id
       WHERE s.status = "published" AND s.deleted_at IS NULL
       ORDER BY s.session_number DESC`
    );
    connection.release();
    res.json(sessions.map(transformSession));
  } catch (error) {
    console.error('Error fetching sessions:', error);
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
    res.json({ ...transformSession(sessions[0]), themes: themes.map(t => t.theme_id) });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;