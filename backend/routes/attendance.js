const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

// Get all classes taught by the current teacher
router.get('/teacher-classes', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // Get unique classes from subject_time_map for this teacher
    const [classes] = await pool.execute(
      `SELECT DISTINCT stm.class, csm.USNStart, csm.USNEnd, csm.defaultRoom
       FROM subject_time_map stm
       LEFT JOIN class_student_map csm ON stm.class = csm.class
       WHERE stm.teacher_id = ?
       ORDER BY stm.class`,
      [teacherId]
    );
    
    res.json(classes);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
});

// Generate USN array from start to end
function generateUSNArray(startUSN, endUSN) {
  if (!startUSN || !endUSN) return [];
  
  const startMatch = startUSN.match(/^(.+?)(\d+)$/);
  const endMatch = endUSN.match(/^(.+?)(\d+)$/);
  
  if (!startMatch || !endMatch) return [];
  
  const prefix = startMatch[1];
  const startNum = parseInt(startMatch[2]);
  const endNum = parseInt(endMatch[2]);
  const numLength = startMatch[2].length;
  
  const usns = [];
  for (let i = startNum; i <= endNum; i++) {
    const paddedNum = String(i).padStart(numLength, '0');
    usns.push(prefix + paddedNum);
  }
  
  return usns;
}

// Get attendance data for a specific class
router.get('/class/:className', authenticateToken, async (req, res) => {
  try {
    const { className } = req.params;
    const teacherId = req.user.id;
    
    // Verify teacher teaches this class
    const [teacherCheck] = await pool.execute(
      'SELECT 1 FROM subject_time_map WHERE class = ? AND teacher_id = ? LIMIT 1',
      [className, teacherId]
    );
    
    if (teacherCheck.length === 0) {
      return res.status(403).json({ message: 'You do not teach this class' });
    }
    
    // Get USN range for the class
    const [classInfo] = await pool.execute(
      'SELECT USNStart, USNEnd FROM class_student_map WHERE class = ?',
      [className]
    );
    
    if (classInfo.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    const usns = generateUSNArray(classInfo[0].USNStart, classInfo[0].USNEnd);
    
    // Get all attendance records for this class
    // Assuming there's an attendance table with columns: id, class, usn, date, status
    const [attendanceRecords] = await pool.execute(
      `SELECT usn, DATE_FORMAT(date, '%Y-%m-%d') as date, status 
       FROM attendance 
       WHERE class = ? 
       ORDER BY date, usn`,
      [className]
    );
    
    // Get unique dates
    const dates = [...new Set(attendanceRecords.map(r => r.date))].sort();
    
    // Create attendance matrix
    const attendanceData = {};
    usns.forEach(usn => {
      attendanceData[usn] = {};
      dates.forEach(date => {
        attendanceData[usn][date] = 'A'; // Default absent
      });
    });
    
    // Fill in actual attendance
    attendanceRecords.forEach(record => {
      if (attendanceData[record.usn]) {
        attendanceData[record.usn][record.date] = record.status;
      }
    });
    
    res.json({
      className,
      usns,
      dates,
      attendanceData
    });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ message: 'Error fetching attendance data', error: error.message });
  }
});

module.exports = router;
