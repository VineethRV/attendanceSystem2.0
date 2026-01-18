# DateTime Utility Functions - Documentation

## Overview

This module provides encoding/decoding functions for handling datetime values in the Attendance Management System. It supports two types of datetime representations:

1. **Dtime (Date-based)**: For actual attendance records with specific dates
2. **DayTime (Day-based)**: For classroom schedules using day-of-week

---

## Installation & Usage

### Import the functions:

```javascript
const {
  encodeDtime,
  decodeDtime,
  encodeDayTime,
  decodeDayTime,
  getDayName,
  getDayNumber,
  getSlotName
} = require('./utils/datetime');
```

---

## Function Reference

### 1. Dtime Functions (For Date-Based Operations)

These functions are used when working with **actual dates** (e.g., student attendance records with specific dates).

#### `encodeDtime(date, slot)`

Encodes a date and time slot into Dtime format for database storage.

**Parameters:**
- `date` (string): Date in DD/MM/YY format (e.g., "18/01/26")
- `slot` (number): Time slot from 1 to 6

**Returns:** (string) Encoded Dtime in format DDMMYY:slot (e.g., "180126:3")

**Example:**
```javascript
encodeDtime("18/01/26", 3)  // Returns "180126:3"
encodeDtime("25/12/25", 6)  // Returns "251225:6"
```

**Use Case:**
```javascript
// Recording student attendance
const dtime = encodeDtime("18/01/26", 3);
const sql = 'INSERT INTO global_student_attendance (studentUsn, Dtime, room) VALUES (?, ?, ?)';
await pool.query(sql, ['1CR21CS001', dtime, 'R101']);
```

---

#### `decodeDtime(dtime)`

Decodes Dtime format into date and time slot for display/processing.

**Parameters:**
- `dtime` (string): Encoded Dtime in format DDMMYY:slot (e.g., "180126:3")

**Returns:** (object) Object with date (DD/MM/YY format) and slot (1-6)

**Example:**
```javascript
decodeDtime("180126:3")  // Returns { date: "18/01/26", slot: 3 }
decodeDtime("251225:6")  // Returns { date: "25/12/25", slot: 6 }
```

**Use Case:**
```javascript
// Reading attendance records
const [rows] = await pool.query('SELECT * FROM global_student_attendance WHERE studentUsn = ?', [usn]);
rows.forEach(row => {
  const { date, slot } = decodeDtime(row.Dtime);
  console.log(`Attended on ${date} at ${getSlotName(slot)}`);
});
```

---

### 2. DayTime Functions (For Classroom Schedule)

These functions are used for **weekly schedules** where you specify day-of-week instead of specific dates.

#### `encodeDayTime(day, slot)`

Encodes day and time slot for classroom_time_map table.

**Parameters:**
- `day` (number): Day number (1=Monday, 2=Tuesday, ..., 6=Saturday)
- `slot` (number): Time slot from 1 to 6

**Returns:** (string) Encoded format "day:slot" (e.g., "1:6")

**Example:**
```javascript
encodeDayTime(1, 6)  // Returns "1:6" (Monday, Slot 6)
encodeDayTime(3, 2)  // Returns "3:2" (Wednesday, Slot 2)
```

**Use Case:**
```javascript
// Saving classroom schedule
const dayNumber = getDayNumber('Monday');  // Returns 1
const dayTime = encodeDayTime(dayNumber, 6);
const sql = 'INSERT INTO class_room_time_map (classId, Dtime, room) VALUES (?, ?, ?)';
await pool.query(sql, ['CS-A', dayTime, 'R101']);
```

---

#### `decodeDayTime(dayTime)`

Decodes day-time format from classroom_time_map table.

**Parameters:**
- `dayTime` (string): Encoded day-time in format "day:slot" (e.g., "1:6")

**Returns:** (object) Object with day (1-6) and slot (1-6)

**Example:**
```javascript
decodeDayTime("1:6")  // Returns { day: 1, slot: 6 } (Monday, Slot 6)
decodeDayTime("3:2")  // Returns { day: 3, slot: 2 } (Wednesday, Slot 2)
```

**Use Case:**
```javascript
// Reading classroom schedule
const [rows] = await pool.query('SELECT * FROM class_room_time_map WHERE classId = ?', ['CS-A']);
rows.forEach(row => {
  const { day, slot } = decodeDayTime(row.Dtime);
  console.log(`${getDayName(day)} at ${getSlotName(slot)}: Room ${row.room}`);
});
```

---

### 3. Helper Functions

#### `getDayName(day)`

Converts day number to day name.

**Parameters:**
- `day` (number): Day number (1-6)

**Returns:** (string) Day name

**Example:**
```javascript
getDayName(1)  // Returns "Monday"
getDayName(6)  // Returns "Saturday"
```

---

#### `getDayNumber(dayName)`

Converts day name to day number.

**Parameters:**
- `dayName` (string): Day name (Monday-Saturday)

**Returns:** (number) Day number (1-6)

**Example:**
```javascript
getDayNumber("Monday")    // Returns 1
getDayNumber("Saturday")  // Returns 6
```

---

#### `getSlotName(slot)`

Returns formatted slot name.

**Parameters:**
- `slot` (number): Slot number (1-6)

**Returns:** (string) Slot name

**Example:**
```javascript
getSlotName(1)  // Returns "Slot 1"
getSlotName(6)  // Returns "Slot 6"
```

---

## Integration Examples

### Example 1: Update classInfo.js route to use encodeDayTime

```javascript
// backend/routes/classInfo.js

const { encodeDayTime, decodeDayTime, getDayName, getDayNumber } = require('../utils/datetime');

// Bulk update schedule
router.post('/classes/:classId/schedule/bulk', authenticateToken, async (req, res) => {
  const { classId } = req.params;
  const { schedule } = req.body;

  try {
    const connection = await pool.getConnection();
    
    // Delete existing schedule
    await connection.query('DELETE FROM class_room_time_map WHERE classId = ?', [classId]);
    
    // Prepare new entries
    const values = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (const dayName of dayNames) {
      const dayNumber = getDayNumber(dayName); // Convert "Monday" -> 1
      
      for (let slot = 1; slot <= 6; slot++) {
        const room = schedule[dayName]?.[`Slot ${slot}`];
        
        if (room) {
          const dayTime = encodeDayTime(dayNumber, slot); // Encode to "1:6"
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
    res.json({ message: 'Schedule updated successfully', count: values.length });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### Example 2: Update getSchedule route to use decodeDayTime

```javascript
// Get schedule for a class
router.get('/classes/:classId/schedule', authenticateToken, async (req, res) => {
  const { classId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM class_room_time_map WHERE classId = ?',
      [classId]
    );

    // Format schedule for frontend
    const schedule = {
      'Monday': {}, 'Tuesday': {}, 'Wednesday': {},
      'Thursday': {}, 'Friday': {}, 'Saturday': {}
    };

    rows.forEach(row => {
      const { day, slot } = decodeDayTime(row.Dtime); // Decode "1:6" -> {day:1, slot:6}
      const dayName = getDayName(day);                // 1 -> "Monday"
      const slotName = `Slot ${slot}`;                // 6 -> "Slot 6"
      
      schedule[dayName][slotName] = row.room;
    });

    res.json(schedule);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### Example 3: Recording Attendance with Dtime

```javascript
// backend/routes/attendance.js (if you create one)

const { encodeDtime, decodeDtime } = require('../utils/datetime');

// Record attendance
router.post('/attendance', authenticateToken, async (req, res) => {
  const { studentUsn, date, slot, room } = req.body;

  try {
    // Encode date and slot
    const dtime = encodeDtime(date, slot); // "18/01/26", 3 -> "180126:3"
    
    const sql = `
      INSERT INTO global_student_attendance (studentUsn, Dtime, room) 
      VALUES (?, ?, ?)
    `;
    
    await pool.query(sql, [studentUsn, dtime, room]);
    
    res.json({ 
      message: 'Attendance recorded',
      dtime: dtime
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance history
router.get('/attendance/:studentUsn', authenticateToken, async (req, res) => {
  const { studentUsn } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM global_student_attendance WHERE studentUsn = ?',
      [studentUsn]
    );

    // Decode Dtime for each record
    const attendance = rows.map(row => {
      const { date, slot } = decodeDtime(row.Dtime); // "180126:3" -> {date:"18/01/26", slot:3}
      
      return {
        date: date,
        slot: slot,
        slotName: getSlotName(slot),
        room: row.room
      };
    });

    res.json(attendance);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Testing

Run the test suite to verify all functions work correctly:

```bash
node backend/utils/datetime.test.js
```

Run the examples to see usage demonstrations:

```bash
node backend/utils/datetime.examples.js
```

---

## Error Handling

All functions include input validation and throw descriptive errors:

```javascript
// Invalid date format
try {
  encodeDtime("invalid", 3);
} catch (error) {
  console.log(error.message); // "Date must be in DD/MM/YY format"
}

// Invalid slot number
try {
  encodeDtime("18/01/26", 7);
} catch (error) {
  console.log(error.message); // "Slot must be a number between 1 and 6"
}

// Invalid day number
try {
  encodeDayTime(7, 1);
} catch (error) {
  console.log(error.message); // "Day must be a number between 1 and 6 (1=Monday, 6=Saturday)"
}
```

---

## Database Schema Reference

### For Dtime (Date-based):
- `global_student_attendance.Dtime` - Format: "DDMMYY:slot" (e.g., "180126:3")
- `teacher_student_attendance.Dtime` - Format: "DDMMYY:slot"

### For DayTime (Schedule-based):
- `class_room_time_map.Dtime` - Format: "day:slot" (e.g., "1:6")

---

## Quick Reference

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `encodeDtime` | date (DD/MM/YY), slot (1-6) | "DDMMYY:slot" | Storing attendance records |
| `decodeDtime` | "DDMMYY:slot" | {date, slot} | Reading attendance records |
| `encodeDayTime` | day (1-6), slot (1-6) | "day:slot" | Storing weekly schedules |
| `decodeDayTime` | "day:slot" | {day, slot} | Reading weekly schedules |
| `getDayName` | day (1-6) | "Monday"-"Saturday" | Display day name |
| `getDayNumber` | "Monday"-"Saturday" | 1-6 | Convert day to number |
| `getSlotName` | slot (1-6) | "Slot 1"-"Slot 6" | Display slot name |

---

## Day Number Reference

| Number | Day Name |
|--------|----------|
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday |
| 6 | Saturday |

---

## Files

- **Module**: `backend/utils/datetime.js`
- **Tests**: `backend/utils/datetime.test.js`
- **Examples**: `backend/utils/datetime.examples.js`
- **Documentation**: `backend/utils/DATETIME_UTILS.md` (this file)

---

## Next Steps

1. ✅ Functions created and tested
2. Update `backend/routes/classInfo.js` to use `encodeDayTime`/`decodeDayTime`
3. Create attendance routes using `encodeDtime`/`decodeDtime`
4. Update frontend API calls if needed
5. Test integration end-to-end

---

**Created**: January 18, 2026  
**Version**: 1.0.0  
**Status**: ✅ Ready for integration
