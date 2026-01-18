const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const pool = require('./config/database');
const authRoutes = require('./routes/auth');
const classInfoRoutes = require('./routes/classInfo');
const configRoutes = require('./routes/config');
const subjectInfoRoutes = require('./routes/subjectInfo');
const authenticateToken = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/class', classInfoRoutes);
app.use('/api/config', configRoutes);
app.use('/api/subject', subjectInfoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔐 CORS enabled for http://localhost:3000`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⛔ Shutting down...');
  await pool.end();
  process.exit(0);
});
