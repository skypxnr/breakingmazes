const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { defaultSite } = require('../utils/transform');

async function loadSettings(connection) {
  const site = defaultSite();
  try {
    const [rows] = await connection.query('SELECT `key`, `value` FROM site_settings');
    for (const row of rows) {
      try {
        site[row.key] = JSON.parse(row.value);
      } catch {
        site[row.key] = row.value;
      }
    }
  } catch {
    // table may not exist yet — return defaults
  }
  return site;
}

router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const site = await loadSettings(connection);
    connection.release();
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    if (!['admin', 'curator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const connection = await pool.getConnection();
    for (const [key, value] of Object.entries(req.body)) {
      const stored = typeof value === 'string' ? value : JSON.stringify(value);
      await connection.query(
        'INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, stored]
      );
    }
    const site = await loadSettings(connection);
    connection.release();
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
