/**
 * Datetime Encoding/Decoding Utilities
 * 
 * This module provides functions to encode and decode datetime values
 * for the attendance system database.
 */

/**
 * Encodes date and time slot into Dtime format
 * 
 * @param {string} date - Date in DD/MM/YY format (e.g., "18/01/26")
 * @param {number} slot - Time slot from 1 to 6
 * @returns {string} Encoded Dtime in format DDMMYY:slot (e.g., "180126:3")
 * 
 * @example
 * encodeDtime("18/01/26", 3) // Returns "180126:3"
 * encodeDtime("25/12/25", 6) // Returns "251225:6"
 */
function encodeDtime(date, slot) {
  // Validate input
  if (!date || typeof date !== 'string') {
    throw new Error('Date must be a non-empty string in DD/MM/YY format');
  }
  
  if (!slot || slot < 1 || slot > 6) {
    throw new Error('Slot must be a number between 1 and 6');
  }
  
  // Remove any slashes from date and validate format
  const dateParts = date.split('/');
  if (dateParts.length !== 3) {
    throw new Error('Date must be in DD/MM/YY format');
  }
  
  const [day, month, year] = dateParts;
  
  // Validate each part
  if (day.length !== 2 || month.length !== 2 || year.length !== 2) {
    throw new Error('Date parts must be 2 digits each (DD/MM/YY)');
  }
  
  // Concatenate to DDMMYY format
  const dateString = day + month + year;
  
  // Return encoded format: DDMMYY:slot
  return `${dateString}:${slot}`;
}

/**
 * Decodes Dtime format into date and time slot
 * 
 * @param {string} dtime - Encoded Dtime in format DDMMYY:slot (e.g., "180126:3")
 * @returns {Object} Object with date (DD/MM/YY format) and slot (1-6)
 * 
 * @example
 * decodeDtime("180126:3") // Returns { date: "18/01/26", slot: 3 }
 * decodeDtime("251225:6") // Returns { date: "25/12/25", slot: 6 }
 */
function decodeDtime(dtime) {
  // Validate input
  if (!dtime || typeof dtime !== 'string') {
    throw new Error('Dtime must be a non-empty string');
  }
  
  // Split by colon
  const parts = dtime.split(':');
  if (parts.length !== 2) {
    throw new Error('Dtime must be in DDMMYY:slot format');
  }
  
  const [dateString, slotString] = parts;
  
  // Validate date string length
  if (dateString.length !== 6) {
    throw new Error('Date portion must be 6 digits (DDMMYY)');
  }
  
  // Extract DD, MM, YY
  const day = dateString.substring(0, 2);
  const month = dateString.substring(2, 4);
  const year = dateString.substring(4, 6);
  
  // Parse slot
  const slot = parseInt(slotString);
  if (isNaN(slot) || slot < 1 || slot > 6) {
    throw new Error('Slot must be a number between 1 and 6');
  }
  
  // Return decoded format
  return {
    date: `${day}/${month}/${year}`,
    slot: slot
  };
}

/**
 * Encodes day and time slot for classroom_time_map table
 * 
 * @param {number} day - Day number (1=Monday, 2=Tuesday, ..., 6=Saturday)
 * @param {number} slot - Time slot from 1 to 6
 * @returns {string} Encoded format "day:slot" (e.g., "1:6")
 * 
 * @example
 * encodeDayTime(1, 6) // Returns "1:6" (Monday, Slot 6)
 * encodeDayTime(3, 2) // Returns "3:2" (Wednesday, Slot 2)
 */
function encodeDayTime(day, slot) {
  // Validate day
  if (!day || day < 1 || day > 6) {
    throw new Error('Day must be a number between 1 and 6 (1=Monday, 6=Saturday)');
  }
  
  // Validate slot
  if (!slot || slot < 1 || slot > 6) {
    throw new Error('Slot must be a number between 1 and 6');
  }
  
  // Return encoded format: day:slot
  return `${day}:${slot}`;
}

/**
 * Decodes day-time format from classroom_time_map table
 * 
 * @param {string} dayTime - Encoded day-time in format "day:slot" (e.g., "1:6")
 * @returns {Object} Object with day (1-6) and slot (1-6)
 * 
 * @example
 * decodeDayTime("1:6") // Returns { day: 1, slot: 6 } (Monday, Slot 6)
 * decodeDayTime("3:2") // Returns { day: 3, slot: 2 } (Wednesday, Slot 2)
 */
function decodeDayTime(dayTime) {
  // Validate input
  if (!dayTime || typeof dayTime !== 'string') {
    throw new Error('DayTime must be a non-empty string');
  }
  
  // Split by colon
  const parts = dayTime.split(':');
  if (parts.length !== 2) {
    throw new Error('DayTime must be in day:slot format');
  }
  
  const [dayString, slotString] = parts;
  
  // Parse day
  const day = parseInt(dayString);
  if (isNaN(day) || day < 1 || day > 6) {
    throw new Error('Day must be a number between 1 and 6 (1=Monday, 6=Saturday)');
  }
  
  // Parse slot
  const slot = parseInt(slotString);
  if (isNaN(slot) || slot < 1 || slot > 6) {
    throw new Error('Slot must be a number between 1 and 6');
  }
  
  // Return decoded format
  return {
    day: day,
    slot: slot
  };
}

/**
 * Helper function to get day name from day number
 * 
 * @param {number} day - Day number (1-6)
 * @returns {string} Day name
 * 
 * @example
 * getDayName(1) // Returns "Monday"
 * getDayName(6) // Returns "Saturday"
 */
function getDayName(day) {
  const dayNames = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };
  
  return dayNames[day] || 'Invalid Day';
}

/**
 * Helper function to get day number from day name
 * 
 * @param {string} dayName - Day name (Monday-Saturday)
 * @returns {number} Day number (1-6)
 * 
 * @example
 * getDayNumber("Monday") // Returns 1
 * getDayNumber("Saturday") // Returns 6
 */
function getDayNumber(dayName) {
  const dayNumbers = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  return dayNumbers[dayName] || null;
}

/**
 * Helper function to get slot name
 * 
 * @param {number} slot - Slot number (1-6)
 * @returns {string} Slot name
 * 
 * @example
 * getSlotName(1) // Returns "Slot 1"
 * getSlotName(6) // Returns "Slot 6"
 */
function getSlotName(slot) {
  if (slot >= 1 && slot <= 6) {
    return `Slot ${slot}`;
  }
  return 'Invalid Slot';
}

module.exports = {
  // Dtime functions (for date-based operations)
  encodeDtime,
  decodeDtime,
  
  // DayTime functions (for classroom_time_map)
  encodeDayTime,
  decodeDayTime,
  
  // Helper functions
  getDayName,
  getDayNumber,
  getSlotName
};
