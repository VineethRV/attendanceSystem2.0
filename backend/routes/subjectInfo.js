const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const { encodeDayTime, decodeDayTime } = require('../utils/datetime');

// Get all subjects for a specific class
router.get('/classes/:classId/subjects', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    
    // First, get the class name
    const [classRows] = await pool.execute(
      'SELECT class FROM class_student_map WHERE id = ?',
      [classId]
    );
    
    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    
    const className = classRows[0].class;
    
    // Get all subjects for this class with teacher info
    const [subjects] = await pool.execute(`
      SELECT 
        stm.id,
        stm.subject,
        stm.DTime,
        stm.teacher_id,
        t.name as teacher_name
      FROM subject_time_map stm
      LEFT JOIN teacher t ON stm.teacher_id = t.id
      WHERE stm.class = ?
      ORDER BY stm.subject, stm.DTime
    `, [className]);
    
    // Decode DTime and group by subject
    const subjectMap = {};
    
    subjects.forEach(sub => {
      if (!subjectMap[sub.subject]) {
        subjectMap[sub.subject] = {
          subject: sub.subject,
          teacher_id: sub.teacher_id,
          teacher_name: sub.teacher_name,
          slots: []
        };
      }
      
      if (sub.DTime) {
        const decoded = decodeDayTime(sub.DTime);
        subjectMap[sub.subject].slots.push({
          id: sub.id,
          day: decoded.day,
          slot: decoded.slot,
          DTime: sub.DTime
        });
      }
    });
    
    const subjectsList = Object.values(subjectMap);
    
    res.json({ 
      success: true, 
      subjects: subjectsList,
      className: className
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a new subject with multiple time slots
router.post('/classes/:classId/subjects', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { classId } = req.params;
    const { subject, teacher_id, slots } = req.body;
    
    // Validation
    if (!subject || !teacher_id || !slots || slots.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject name, teacher, and at least one time slot are required' 
      });
    }
    
    // Get the class name
    const [classRows] = await connection.execute(
      'SELECT class FROM class_student_map WHERE id = ?',
      [classId]
    );
    
    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    
    const className = classRows[0].class;
    
    // Verify teacher exists
    const [teacherRows] = await connection.execute(
      'SELECT id FROM teacher WHERE id = ?',
      [teacher_id]
    );
    
    if (teacherRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    await connection.beginTransaction();
    
    // Check for conflicts with existing subjects
    for (const slot of slots) {
      const encodedDTime = encodeDayTime(slot.day, slot.slot);
      
      const [existing] = await connection.execute(
        'SELECT subject FROM subject_time_map WHERE class = ? AND DTime = ?',
        [className, encodedDTime]
      );
      
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(409).json({ 
          success: false, 
          message: `Slot (Day ${slot.day}, Slot ${slot.slot}) is already occupied by ${existing[0].subject}` 
        });
      }
    }
    
    // Insert each time slot
    for (const slot of slots) {
      const encodedDTime = encodeDayTime(slot.day, slot.slot);
      
      await connection.execute(
        'INSERT INTO subject_time_map (class, teacher_id, subject, DTime) VALUES (?, ?, ?, ?)',
        [className, teacher_id, subject, encodedDTime]
      );
    }
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Subject added successfully',
      slotsAdded: slots.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding subject:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Update a subject (subject name, teacher, or time slots)
router.put('/classes/:classId/subjects/:subjectName', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { classId, subjectName } = req.params;
    const { newSubjectName, teacher_id, slots } = req.body;
    
    // Get the class name
    const [classRows] = await connection.execute(
      'SELECT class FROM class_student_map WHERE id = ?',
      [classId]
    );
    
    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    
    const className = classRows[0].class;
    
    await connection.beginTransaction();
    
    // Delete old slots for this subject
    await connection.execute(
      'DELETE FROM subject_time_map WHERE class = ? AND subject = ?',
      [className, subjectName]
    );
    
    // Check for conflicts with other subjects
    if (slots && slots.length > 0) {
      for (const slot of slots) {
        const encodedDTime = encodeDayTime(slot.day, slot.slot);
        
        const [existing] = await connection.execute(
          'SELECT subject FROM subject_time_map WHERE class = ? AND DTime = ?',
          [className, encodedDTime]
        );
        
        if (existing.length > 0) {
          await connection.rollback();
          return res.status(409).json({ 
            success: false, 
            message: `Slot (Day ${slot.day}, Slot ${slot.slot}) is already occupied by ${existing[0].subject}` 
          });
        }
      }
      
      // Insert new slots
      const finalSubjectName = newSubjectName || subjectName;
      
      for (const slot of slots) {
        const encodedDTime = encodeDayTime(slot.day, slot.slot);
        
        await connection.execute(
          'INSERT INTO subject_time_map (class, teacher_id, subject, DTime) VALUES (?, ?, ?, ?)',
          [className, teacher_id, finalSubjectName, encodedDTime]
        );
      }
    }
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Subject updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating subject:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Delete a subject
router.delete('/classes/:classId/subjects/:subjectName', authenticateToken, async (req, res) => {
  try {
    const { classId, subjectName } = req.params;
    
    // Get the class name
    const [classRows] = await pool.execute(
      'SELECT class FROM class_student_map WHERE id = ?',
      [classId]
    );
    
    if (classRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    
    const className = classRows[0].class;
    
    // Delete all slots for this subject
    const [result] = await pool.execute(
      'DELETE FROM subject_time_map WHERE class = ? AND subject = ?',
      [className, subjectName]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Subject deleted successfully',
      slotsDeleted: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all teachers
router.get('/teachers', authenticateToken, async (req, res) => {
  try {
    const [teachers] = await pool.execute(
      'SELECT id, name, designation, email FROM teacher ORDER BY name'
    );
    
    res.json({ 
      success: true, 
      teachers: teachers
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
