const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get all room-IP mappings
router.get('/room-ip', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [mappings] = await connection.query(
      'SELECT * FROM room_ip_map ORDER BY id ASC'
    );
    connection.release();

    res.json({ mappings });
  } catch (error) {
    console.error('Get room-IP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific room-IP mapping
router.get('/room-ip/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [mappings] = await connection.query(
      'SELECT * FROM room_ip_map WHERE id = ?',
      [id]
    );

    connection.release();

    if (mappings.length === 0) {
      return res.status(404).json({ message: 'Room-IP mapping not found' });
    }

    res.json({ mapping: mappings[0] });
  } catch (error) {
    console.error('Get room-IP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new room-IP mapping
router.post('/room-ip', authenticateToken, async (req, res) => {
  try {
    const { room, ip } = req.body;

    // Validation
    if (!room || !ip) {
      return res.status(400).json({ message: 'Room and IP are required' });
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ message: 'Invalid IP address format' });
    }

    const connection = await pool.getConnection();

    // Check for duplicate room
    const [existingRoom] = await connection.query(
      'SELECT * FROM room_ip_map WHERE room = ?',
      [room]
    );

    if (existingRoom.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'Room already has an IP mapping' });
    }

    // Check for duplicate IP
    const [existingIp] = await connection.query(
      'SELECT * FROM room_ip_map WHERE ip = ?',
      [ip]
    );

    if (existingIp.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'IP address is already assigned to another room' });
    }

    // Insert mapping
    const [result] = await connection.query(
      'INSERT INTO room_ip_map (room, ip) VALUES (?, ?)',
      [room, ip]
    );

    connection.release();

    res.status(201).json({
      message: 'Room-IP mapping added successfully',
      mapping: {
        id: result.insertId,
        room,
        ip
      }
    });
  } catch (error) {
    console.error('Add room-IP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update room-IP mapping
router.put('/room-ip/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { room, ip } = req.body;

    if (!room || !ip) {
      return res.status(400).json({ message: 'Room and IP are required' });
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ message: 'Invalid IP address format' });
    }

    const connection = await pool.getConnection();

    // Get current mapping to check for changes
    const [current] = await connection.query(
      'SELECT * FROM room_ip_map WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Room-IP mapping not found' });
    }

    // Check for duplicate room (if room name changed)
    if (current[0].room !== room) {
      const [duplicateRoom] = await connection.query(
        'SELECT * FROM room_ip_map WHERE room = ? AND id != ?',
        [room, id]
      );

      if (duplicateRoom.length > 0) {
        connection.release();
        return res.status(409).json({ message: 'Room already has an IP mapping' });
      }
    }

    // Check for duplicate IP (if IP changed)
    if (current[0].ip !== ip) {
      const [duplicateIp] = await connection.query(
        'SELECT * FROM room_ip_map WHERE ip = ? AND id != ?',
        [ip, id]
      );

      if (duplicateIp.length > 0) {
        connection.release();
        return res.status(409).json({ message: 'IP address is already assigned to another room' });
      }
    }

    // Update mapping
    await connection.query(
      'UPDATE room_ip_map SET room = ?, ip = ? WHERE id = ?',
      [room, ip, id]
    );

    connection.release();

    res.json({
      message: 'Room-IP mapping updated successfully',
      mapping: {
        id,
        room,
        ip
      }
    });
  } catch (error) {
    console.error('Update room-IP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete room-IP mapping
router.delete('/room-ip/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'DELETE FROM room_ip_map WHERE id = ?',
      [id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Room-IP mapping not found' });
    }

    res.json({ message: 'Room-IP mapping deleted successfully' });
  } catch (error) {
    console.error('Delete room-IP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
