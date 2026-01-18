/**
 * Example Usage of DateTime Utility Functions
 * 
 * This file demonstrates how to use the datetime encoding/decoding functions
 * in your backend routes and controllers.
 */

const {
  encodeDtime,
  decodeDtime,
  encodeDayTime,
  decodeDayTime,
  getDayName,
  getDayNumber,
  getSlotName
} = require('./datetime');

// ============================================================================
// EXAMPLE 1: Using Dtime functions for attendance records
// ============================================================================

console.log('EXAMPLE 1: Recording student attendance with date and time slot\n');

// When recording attendance
function recordAttendance(studentUsn, date, slot, roomNumber) {
  // Encode the date and slot into Dtime format
  const dtime = encodeDtime(date, slot);
  
  console.log(`Recording attendance for ${studentUsn}`);
  console.log(`  Date: ${date}`);
  console.log(`  Slot: ${slot}`);
  console.log(`  Encoded Dtime: ${dtime}`);
  console.log(`  Room: ${roomNumber}`);
  
  // SQL query example
  const sql = `
    INSERT INTO global_student_attendance (studentUsn, Dtime, room) 
    VALUES (?, ?, ?)
  `;
  console.log(`  SQL: ${sql}`);
  console.log(`  Values: ["${studentUsn}", "${dtime}", "${roomNumber}"]`);
  console.log();
  
  return dtime;
}

// Example: Record attendance for student on 18/01/26 at slot 3
recordAttendance('1CR21CS001', '18/01/26', 3, 'R101');

// When reading attendance records
function getAttendanceDetails(dtimeFromDb) {
  // Decode the Dtime value from database
  const decoded = decodeDtime(dtimeFromDb);
  
  console.log(`Reading attendance record`);
  console.log(`  Encoded Dtime from DB: ${dtimeFromDb}`);
  console.log(`  Decoded Date: ${decoded.date}`);
  console.log(`  Decoded Slot: ${decoded.slot}`);
  console.log(`  Slot Name: ${getSlotName(decoded.slot)}`);
  console.log();
  
  return decoded;
}

// Example: Read attendance record
getAttendanceDetails('180126:3');

// ============================================================================
// EXAMPLE 2: Using DayTime functions for classroom schedule
// ============================================================================

console.log('EXAMPLE 2: Managing classroom schedule with day and time slot\n');

// When saving classroom schedule
function saveClassroomSchedule(classId, day, slot, roomNumber, subjectCode) {
  // Encode day and slot into DayTime format
  const dayTime = encodeDayTime(day, slot);
  
  console.log(`Saving classroom schedule for class ${classId}`);
  console.log(`  Day: ${day} (${getDayName(day)})`);
  console.log(`  Slot: ${slot} (${getSlotName(slot)})`);
  console.log(`  Encoded DayTime: ${dayTime}`);
  console.log(`  Room: ${roomNumber}`);
  console.log(`  Subject: ${subjectCode}`);
  
  // SQL query example
  const sql = `
    INSERT INTO class_room_time_map (classId, Dtime, room, subjectCode) 
    VALUES (?, ?, ?, ?)
  `;
  console.log(`  SQL: ${sql}`);
  console.log(`  Values: [${classId}, "${dayTime}", "${roomNumber}", "${subjectCode}"]`);
  console.log();
  
  return dayTime;
}

// Example: Save schedule for Monday (day=1), Slot 6, Room R101
saveClassroomSchedule('CS-A', 1, 6, 'R101', 'CS101');

// When reading classroom schedule
function getScheduleDetails(dayTimeFromDb) {
  // Decode the DayTime value from database
  const decoded = decodeDayTime(dayTimeFromDb);
  
  console.log(`Reading schedule`);
  console.log(`  Encoded DayTime from DB: ${dayTimeFromDb}`);
  console.log(`  Decoded Day: ${decoded.day} (${getDayName(decoded.day)})`);
  console.log(`  Decoded Slot: ${decoded.slot} (${getSlotName(decoded.slot)})`);
  console.log();
  
  return decoded;
}

// Example: Read schedule
getScheduleDetails('1:6');

// ============================================================================
// EXAMPLE 3: Bulk schedule update (like in your ClassInfo page)
// ============================================================================

console.log('EXAMPLE 3: Bulk schedule update for 6x6 grid\n');

function bulkUpdateSchedule(classId, scheduleData) {
  console.log(`Bulk updating schedule for class ${classId}`);
  console.log(`Schedule data:`, scheduleData);
  console.log();
  
  // Delete existing schedule
  console.log(`DELETE FROM class_room_time_map WHERE classId = "${classId}"`);
  console.log();
  
  // Insert new schedule entries
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const entries = [];
  
  for (let dayIndex = 0; dayIndex < dayNames.length; dayIndex++) {
    const dayName = dayNames[dayIndex];
    const dayNumber = getDayNumber(dayName); // Convert day name to number (1-6)
    
    for (let slot = 1; slot <= 6; slot++) {
      const room = scheduleData[dayName]?.[`Slot ${slot}`];
      
      if (room) {
        // Encode day and slot
        const dayTime = encodeDayTime(dayNumber, slot);
        
        console.log(`  Insert: Day=${dayNumber} (${dayName}), Slot=${slot}, Room=${room}, Encoded=${dayTime}`);
        
        entries.push({
          classId: classId,
          Dtime: dayTime,
          room: room,
          subjectCode: null
        });
      }
    }
  }
  
  console.log();
  console.log(`Total entries to insert: ${entries.length}`);
  console.log();
  
  return entries;
}

// Example schedule data (from frontend)
const exampleSchedule = {
  'Monday': {
    'Slot 1': 'R101',
    'Slot 2': 'R101',
    'Slot 3': 'R102',
    'Slot 4': 'R102',
    'Slot 5': 'R103',
    'Slot 6': 'R103'
  },
  'Tuesday': {
    'Slot 1': 'R104',
    'Slot 2': 'R104',
    'Slot 3': 'R105',
    'Slot 4': 'R105',
    'Slot 5': 'R106',
    'Slot 6': 'R106'
  }
  // ... other days
};

bulkUpdateSchedule('CS-A', exampleSchedule);

// ============================================================================
// EXAMPLE 4: Retrieving and formatting schedule for frontend
// ============================================================================

console.log('EXAMPLE 4: Formatting schedule from database for frontend\n');

function getScheduleForFrontend(classId, dbResults) {
  console.log(`Formatting schedule for frontend`);
  console.log(`Class: ${classId}`);
  console.log(`DB Results count: ${dbResults.length}`);
  console.log();
  
  // Initialize empty schedule
  const schedule = {
    'Monday': {},
    'Tuesday': {},
    'Wednesday': {},
    'Thursday': {},
    'Friday': {},
    'Saturday': {}
  };
  
  // Process each database row
  dbResults.forEach(row => {
    // Decode the DayTime
    const decoded = decodeDayTime(row.Dtime);
    const dayName = getDayName(decoded.day);
    const slotName = getSlotName(decoded.slot);
    
    console.log(`  Processing: ${row.Dtime} -> ${dayName}, ${slotName} = ${row.room}`);
    
    // Add to schedule
    schedule[dayName][slotName] = row.room;
  });
  
  console.log();
  console.log(`Formatted schedule:`, schedule);
  console.log();
  
  return schedule;
}

// Example database results
const mockDbResults = [
  { Dtime: '1:1', room: 'R101', subjectCode: null },
  { Dtime: '1:2', room: 'R101', subjectCode: null },
  { Dtime: '1:6', room: 'R103', subjectCode: null },
  { Dtime: '2:3', room: 'R105', subjectCode: null }
];

getScheduleForFrontend('CS-A', mockDbResults);

// ============================================================================
// EXAMPLE 5: Express Route Integration
// ============================================================================

console.log('EXAMPLE 5: Express Route Integration\n');

console.log(`
// In your backend/routes/classInfo.js or attendance routes:

const { encodeDayTime, decodeDayTime, getDayName, getDayNumber } = require('../utils/datetime');

// Route to save schedule
router.post('/classes/:classId/schedule/bulk', authenticateToken, async (req, res) => {
  const { classId } = req.params;
  const { schedule } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    // Delete existing schedule
    await connection.query('DELETE FROM class_room_time_map WHERE classId = ?', [classId]);
    
    // Prepare insert values
    const values = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (const dayName of dayNames) {
      const dayNumber = getDayNumber(dayName);
      
      for (let slot = 1; slot <= 6; slot++) {
        const room = schedule[dayName]?.[\`Slot \${slot}\`];
        
        if (room) {
          const dayTime = encodeDayTime(dayNumber, slot); // Encode to "day:slot"
          values.push([classId, dayTime, room, null]);
        }
      }
    }
    
    // Insert new schedule
    if (values.length > 0) {
      await connection.query(
        'INSERT INTO class_room_time_map (classId, Dtime, room, subjectCode) VALUES ?',
        [values]
      );
    }
    
    connection.release();
    res.json({ message: 'Schedule updated successfully' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get schedule
router.get('/classes/:classId/schedule', authenticateToken, async (req, res) => {
  const { classId } = req.params;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM class_room_time_map WHERE classId = ?',
      [classId]
    );
    
    // Format for frontend
    const schedule = {
      'Monday': {}, 'Tuesday': {}, 'Wednesday': {},
      'Thursday': {}, 'Friday': {}, 'Saturday': {}
    };
    
    rows.forEach(row => {
      const decoded = decodeDayTime(row.Dtime); // Decode from "day:slot"
      const dayName = getDayName(decoded.day);
      const slotName = \`Slot \${decoded.slot}\`;
      
      schedule[dayName][slotName] = row.room;
    });
    
    res.json(schedule);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
`);

console.log('\n=== Examples Complete ===');
console.log('\nTo run tests: node backend/utils/datetime.test.js');
console.log('To see examples: node backend/utils/datetime.examples.js');
