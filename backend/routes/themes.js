const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { transformTheme } = require('../utils/transform');

router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [themes] = await connection.query(
      'SELECT * FROM themes WHERE deleted_at IS NULL ORDER BY display_order ASC'
    );
    connection.release();
    res.json(themes.map(transformTheme));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
