const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const { encodeDayTime, decodeDayTime, getDayName, getDayNumber } = require('../utils/datetime');

const router = express.Router();

// Helper function to calculate student count
const calculateStudentCount = (usnStart, usnEnd) => {
  try {
    const startNum = parseInt(usnStart.slice(-3));
    const endNum = parseInt(usnEnd.slice(-3));
    if (!isNaN(startNum) && !isNaN(endNum)) {
      return endNum - startNum + 1;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return 0;
};

// Get all classes
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [classes] = await connection.query(
      'SELECT * FROM class_student_map'
    );
    connection.release();

    res.json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific class
router.get('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [classes] = await connection.query(
      'SELECT * FROM class_student_map WHERE id = ?',
      [id]
    );

    if (classes.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Class not found' });
    }

    const classData = classes[0];

    // Get classroom schedule for this class
    const [schedule] = await connection.query(
      'SELECT * FROM class_room_time_map WHERE id = (SELECT id FROM class_room_time_map WHERE room IN (SELECT room FROM class_room_time_map) LIMIT 1)'
    );

    connection.release();

    res.json({ class: classData, schedule });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new class
router.post('/classes', authenticateToken, async (req, res) => {
  try {
    const { className, usnStart, usnEnd, defaultRoom } = req.body;

    // Validation
    if (!className || !usnStart || !usnEnd) {
      return res.status(400).json({ message: 'Class name and USN range are required' });
    }

    // Validate className length (max 5 characters)
    if (className.length > 5) {
      return res.status(400).json({ message: 'Class name must be 5 characters or less' });
    }

    const connection = await pool.getConnection();

    // Validate that defaultRoom exists in room_ip_map (if provided)
    if (defaultRoom) {
      const [roomExists] = await connection.query(
        'SELECT * FROM room_ip_map WHERE room = ?',
        [defaultRoom]
      );

      if (roomExists.length === 0) {
        connection.release();
        return res.status(400).json({ message: 'Default room must exist in room-IP mappings' });
      }
    }

    // Insert into class_student_map
    const [result] = await connection.query(
      'INSERT INTO class_student_map (class, USNStart, USNEnd, defaultRoom) VALUES (?, ?, ?, ?)',
      [className, usnStart, usnEnd, defaultRoom || null]
    );

    connection.release();

    res.status(201).json({
      message: 'Class added successfully',
      classId: result.insertId,
      class: {
        id: result.insertId,
        class: className,
        USNStart: usnStart,
        USNEnd: usnEnd,
        defaultRoom: defaultRoom || null,
        studentCount: calculateStudentCount(usnStart, usnEnd)
      }
    });
  } catch (error) {
    console.error('Add class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update class
router.put('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { className, usnStart, usnEnd, defaultRoom } = req.body;

    if (!className || !usnStart || !usnEnd) {
      return res.status(400).json({ message: 'Class name and USN range are required' });
    }

    // Validate className length (max 5 characters)
    if (className.length > 5) {
      return res.status(400).json({ message: 'Class name must be 5 characters or less' });
    }

    const connection = await pool.getConnection();

    // Validate that defaultRoom exists in room_ip_map (if provided)
    if (defaultRoom) {
      const [roomExists] = await connection.query(
        'SELECT * FROM room_ip_map WHERE room = ?',
        [defaultRoom]
      );

      if (roomExists.length === 0) {
        connection.release();
        return res.status(400).json({ message: 'Default room must exist in room-IP mappings' });
      }
    }

    await connection.query(
      'UPDATE class_student_map SET class = ?, USNStart = ?, USNEnd = ?, defaultRoom = ? WHERE id = ?',
      [className, usnStart, usnEnd, defaultRoom || null, id]
    );

    connection.release();

    res.json({
      message: 'Class updated successfully',
      class: {
        id,
        class: className,
        USNStart: usnStart,
        USNEnd: usnEnd,
        defaultRoom: defaultRoom || null,
        studentCount: calculateStudentCount(usnStart, usnEnd)
      }
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete class
router.delete('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    // Delete related classroom schedules
    await connection.query(
      'DELETE FROM class_room_time_map WHERE id = ?',
      [id]
    );

    // Delete the class
    const [result] = await connection.query(
      'DELETE FROM class_student_map WHERE id = ?',
      [id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get classroom schedule for a class (6x6 table)
router.get('/classes/:classId/schedule', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const connection = await pool.getConnection();

    // First, get the class name from class_student_map
    const [classData] = await connection.query(
      'SELECT class FROM class_student_map WHERE id = ?',
      [classId]
    );

    if (classData.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Class not found' });
    }

    const className = classData[0].class;

    // Get all schedule entries for this class
    const [schedules] = await connection.query(
      'SELECT * FROM class_room_time_map WHERE class = ?',
      [className]
    );

    connection.release();

    // Convert to frontend format (decode DayTime)
    const schedule = {
      'Monday': {}, 'Tuesday': {}, 'Wednesday': {},
      'Thursday': {}, 'Friday': {}, 'Saturday': {}
    };

    schedules.forEach(entry => {
      const { day, slot } = decodeDayTime(entry.DTime); // Decode "1:6" -> {day:1, slot:6}
      const dayName = getDayName(day); // 1 -> "Monday"
      const slotName = `Slot ${slot}`; // 6 -> "Slot 6"

      schedule[dayName][slotName] = entry.room;
    });

    res.json(schedule);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add/Update classroom schedule entry
router.post('/classes/:classId/schedule', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { dtime, room } = req.body;

    if (!dtime || !room) {
      return res.status(400).json({ message: 'Day-Time and Room are required' });
    }

    const connection = await pool.getConnection();

    // First, get the class name from class_student_map
    const [classData] = await connection.query(
      'SELECT class FROM class_student_map WHERE id = ?',
      [classId]
    );

    if (classData.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Class not found' });
    }

    const className = classData[0].class;

    // Check if entry exists
    const [existing] = await connection.query(
      'SELECT * FROM class_room_time_map WHERE class = ? AND DTime = ?',
      [className, dtime]
    );

    if (existing.length > 0) {
      // Update
      await connection.query(
        'UPDATE class_room_time_map SET room = ? WHERE class = ? AND DTime = ?',
        [room, className, dtime]
      );
    } else {
      // Insert
      await connection.query(
        'INSERT INTO class_room_time_map (DTime, room, class) VALUES (?, ?, ?)',
        [dtime, room, className]
      );
    }

    connection.release();

    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Add schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk update schedule (for 6x6 table)
router.post('/classes/:classId/schedule/bulk', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { scheduleData } = req.body; // Object with day-slot: room mappings

    if (!scheduleData || typeof scheduleData !== 'object') {
      return res.status(400).json({ message: 'Schedule data is required' });
    }

    const connection = await pool.getConnection();

    // First, get the class name from class_student_map
    const [classData] = await connection.query(
      'SELECT class FROM class_student_map WHERE id = ?',
      [classId]
    );

    if (classData.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Class not found' });
    }

    const className = classData[0].class;

    // Delete existing schedules for this class
    await connection.query(
      'DELETE FROM class_room_time_map WHERE class = ?',
      [className]
    );

    // Insert all new schedule entries
    const promises = [];
    Object.entries(scheduleData).forEach(([daySlot, room]) => {
      if (room && room.trim()) {
        // Parse day-slot format (e.g., "Monday-Slot 1")
        const [dayName, slotName] = daySlot.split('-');
        const slotNumber = parseInt(slotName.split(' ')[1]); // Extract number from "Slot 1"
        const dayNumber = getDayNumber(dayName); // Convert "Monday" to 1

        // Encode using encodeDayTime function
        const encodedDayTime = encodeDayTime(dayNumber, slotNumber);

        promises.push(
          connection.query(
            'INSERT INTO class_room_time_map (DTime, room, class) VALUES (?, ?, ?)',
            [encodedDayTime, room, className]
          )
        );
      }
    });

    await Promise.all(promises);
    connection.release();

    res.json({ message: 'Schedule updated successfully', count: promises.length });
  } catch (error) {
    console.error('Bulk update schedule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
