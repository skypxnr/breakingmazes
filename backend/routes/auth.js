
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const connection = await pool.getConnection();
    
    // Check if user exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    // Insert user
    await connection.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, name, email, hashedPassword]
    );
    
    // Assign 'student' role by default
    const [role] = await connection.query('SELECT id FROM roles WHERE slug = ?', ['student']);
    if (role.length > 0) {
      await connection.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, role[0].id]
      );
    }
    
    connection.release();
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const connection = await pool.getConnection();
    
    const [users] = await connection.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found in database' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const secret = process.env.JWT_SECRET || 'dev_breaking_mazes_secret_key_12345';
    const token = jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: 'student' },
  secret,
  { expiresIn: '24h' } // Use explicit string format '24h' or '7d'
);
    
    res.json({ message: 'Success', token, user });
  } catch (error) {
    // THIS SENDS THE EXACT ERROR BACK TO YOUR BROWSER INSTEAD OF A GENERIC 500
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack 
    });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;