require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const sessionsRoutes = require('./routes/sessions');
const speakersRoutes = require('./routes/speakers');
const themesRoutes = require('./routes/themes');
const questionsRoutes = require('./routes/questions');
const settingsRoutes = require('./routes/settings');

const app = express();
const ROOT = path.join(__dirname, '..');

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/speakers', speakersRoutes);
app.use('/api/themes', themesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM speakers');
    connection.release();
    res.json({ message: 'Database connected!', speakers: rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(ROOT));

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
