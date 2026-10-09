const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { transformSpeaker } = require('../utils/transform');

router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [speakers] = await connection.query(
      'SELECT * FROM speakers WHERE deleted_at IS NULL ORDER BY display_order ASC'
    );
    connection.release();
    res.json(speakers.map(transformSpeaker));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [speakers] = await connection.query(
      'SELECT * FROM speakers WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    connection.release();

    if (speakers.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }

    res.json(transformSpeaker(speakers[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
