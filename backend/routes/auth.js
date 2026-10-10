
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
    
    // Find user - simplified query
    const [users] = await connection.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    
    connection.release();
    
    if (users.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    console.log('User found:', user.email);
    
    // Verify password
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({ error: 'Password verification failed: ' + bcryptError.message });
    }
    
    if (!validPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT
const token = jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: 'student' },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);
    
    console.log('Login successful:', email);
    
    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;