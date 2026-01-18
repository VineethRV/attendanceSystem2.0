const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

// Register Teacher
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, designation } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const connection = await pool.getConnection();

    // Check if email already exists
    const [existingTeacher] = await connection.query(
      'SELECT * FROM teacher WHERE email = ?',
      [email]
    );

    if (existingTeacher.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert teacher
    const [result] = await connection.query(
      'INSERT INTO teacher (name, email, hashed_password, designation) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, designation || null]
    );

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, name, email, designation },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.status(201).json({
      message: 'Teacher registered successfully',
      token,
      teacher: {
        id: result.insertId,
        name,
        email,
        designation
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login Teacher
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    // Find teacher by email
    const [teachers] = await connection.query(
      'SELECT * FROM teacher WHERE email = ?',
      [email]
    );

    if (teachers.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const teacher = teachers[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, teacher.hashed_password);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: teacher.id, 
        name: teacher.name, 
        email: teacher.email, 
        designation: teacher.designation 
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        designation: teacher.designation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current teacher (for verifying token)
router.get('/me', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [teachers] = await connection.query(
      'SELECT id, name, email, designation FROM teacher WHERE id = ?',
      [req.teacher.id]
    );
    connection.release();

    if (teachers.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ teacher: teachers[0] });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
