const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { transformQuestion } = require('../utils/transform');

router.get('/approved', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [questions] = await connection.query(
      `SELECT * FROM student_questions
       WHERE status = 'approved' AND deleted_at IS NULL
       ORDER BY created_at DESC`
    );
    connection.release();
    res.json(questions.map(transformQuestion));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { session_id, student_name, student_email, student_year, question_text } = req.body;

    if (!session_id || !student_name || !student_email || !question_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    const questionId = uuidv4();

    await connection.query(
      `INSERT INTO student_questions
       (id, session_id, student_name, student_email, student_year, question_text, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [questionId, session_id, student_name, student_email, student_year || '', question_text]
    );

    connection.release();

    res.status(201).json({
      message: 'Question submitted. Awaiting moderation.',
      id: questionId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pending', auth, async (req, res) => {
  try {
    if (!['admin', 'curator', 'editor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const connection = await pool.getConnection();
    const [questions] = await connection.query(
      `SELECT q.*, s.title AS session_title FROM student_questions q
       JOIN sessions s ON q.session_id = s.id
       WHERE q.status = 'pending' AND q.deleted_at IS NULL
       ORDER BY q.created_at ASC`
    );
    connection.release();

    res.json(questions.map(transformQuestion));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'curator', 'editor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE student_questions SET status = ?, moderated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );
    connection.release();

    res.json({ message: `Question ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
