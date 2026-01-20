const fs = require('fs');
const path = require('path');
const http = require('http');
const pool = require('../config/database');
const { encodeDayTime } = require('../utils/datetime');

// Load slot configuration
const configPath = path.join(__dirname, '../config/slotConfig.json');

// Simulated state
let simulatedTime = null;
let simulatedDay = null; // 1=Monday, 2=Tuesday, ..., 6=Saturday
let simulationMode = false;

// Day name mapping
const dayNames = {
  1: 'Monday',
  2: 'Tuesday', 
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

function loadConfig() {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Error loading slot config:', error.message);
    return null;
  }
}

// Get current time in HH:MM format (24-hour)
function getCurrentTime() {
  if (simulationMode && simulatedTime) {
    return simulatedTime;
  }
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Get current day (1=Monday, 2=Tuesday, ..., 6=Saturday, 7=Sunday)
function getCurrentDay() {
  if (simulationMode && simulatedDay) {
    return simulatedDay;
  }
  const now = new Date();
  // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
  // We want: 1=Monday, 2=Tuesday, ..., 6=Saturday, 7=Sunday
  const jsDay = now.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

// Get slot number from time
function getSlotFromTime(time) {
  const config = loadConfig();
  if (!config) return null;
  
  for (const [slotNumber, slotTime] of Object.entries(config.slots)) {
    if (time === slotTime) {
      return parseInt(slotNumber);
    }
  }
  return null;
}

// Set simulated time and day
function setSimulatedTime(time, day = null) {
  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) {
    throw new Error('Invalid time format. Use HH:MM (24-hour format)');
  }
  
  // Normalize time to HH:MM format
  const [hours, minutes] = time.split(':');
  simulatedTime = `${hours.padStart(2, '0')}:${minutes}`;
  
  // Set day if provided
  if (day !== null) {
    const dayNum = parseInt(day);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
      throw new Error('Day must be between 1 (Monday) and 7 (Sunday)');
    }
    simulatedDay = dayNum;
  }
  
  simulationMode = true;
  
  console.log(`🕐 Simulation mode ON - Time: ${simulatedTime}, Day: ${dayNames[simulatedDay] || 'Not set'}`);
  
  // Trigger check immediately with simulated time
  return triggerSlotCheck();
}

// Set simulated day only
function setSimulatedDay(day) {
  const dayNum = parseInt(day);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
    throw new Error('Day must be between 1 (Monday) and 7 (Sunday)');
  }
  simulatedDay = dayNum;
  simulationMode = true;
  
  console.log(`🕐 Simulation day set to ${dayNames[simulatedDay]}`);
  
  return getSimulationStatus();
}

// Clear simulation and return to real time
function clearSimulation() {
  simulatedTime = null;
  simulatedDay = null;
  simulationMode = false;
  console.log('🕐 Simulation mode OFF - Using real time');
}

// Get simulation status
function getSimulationStatus() {
  const config = loadConfig();
  const now = new Date();
  const realDay = now.getDay() === 0 ? 7 : now.getDay();
  
  return {
    simulationMode,
    simulatedTime,
    simulatedDay,
    simulatedDayName: simulatedDay ? dayNames[simulatedDay] : null,
    realTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    realDay,
    realDayName: dayNames[realDay] || 'Sunday',
    activeTime: getCurrentTime(),
    activeDay: getCurrentDay(),
    activeDayName: dayNames[getCurrentDay()] || 'Sunday',
    slots: config?.slots || {},
    masterRouterAddress: config?.master_router_address || null,
    dayOptions: dayNames
  };
}

// Generate array of USNs from start to end
function generateUSNArray(startUSN, endUSN) {
  if (!startUSN || !endUSN) return [];
  
  // Extract prefix and numeric parts
  // Assumes format like: 1RV23CS001
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

// Send message to master router
async function sendToMasterRouter(address, message) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: address,
      port: 80,
      path: '/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(message)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Message sent to ${address} - Status: ${res.statusCode}`);
      resolve({ success: true, statusCode: res.statusCode });
    });

    req.on('error', (error) => {
      console.error(`❌ Master offline: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`❌ Request to ${address} timed out`);
      reject(new Error('Request timed out'));
    });

    req.write(message);
    req.end();
  });
}

// Query database for subject_time_map entries matching the encoded day:slot
async function getScheduleEntries(encodedDayTime) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        stm.DTime, 
        csm.defaultRoom as room, 
        stm.class,
        csm.USNStart,
        csm.USNEnd
      FROM subject_time_map stm
      LEFT JOIN class_student_map csm ON stm.class = csm.class
      WHERE stm.DTime = ?`,
      [encodedDayTime]
    );
    return rows;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    return [];
  }
}

// Main trigger function - called when time matches a slot
async function triggerSlotCheck() {
  const config = loadConfig();
  if (!config) return { triggered: false, slot: null, message: 'Config not loaded' };

  const currentTime = getCurrentTime();
  const currentDay = getCurrentDay();
  const slot = getSlotFromTime(currentTime);
  
  // If time doesn't match any slot
  if (!slot) {
    return { 
      triggered: false, 
      slot: null, 
      time: currentTime,
      day: currentDay,
      dayName: dayNames[currentDay],
      message: `Time ${currentTime} does not match any slot`
    };
  }

  // Skip Sunday (day 7) - no classes
  if (currentDay === 7) {
    return {
      triggered: false,
      slot,
      time: currentTime,
      day: currentDay,
      dayName: 'Sunday',
      message: 'No classes on Sunday'
    };
  }

  // Encode day:slot format
  const encodedDayTime = encodeDayTime(currentDay, slot);
  console.log(`🔔 Slot ${slot} triggered at ${currentTime} on ${dayNames[currentDay]}`);
  console.log(`📝 Encoded DayTime: ${encodedDayTime}`);

  // Query database for matching schedule entries
  const scheduleEntries = await getScheduleEntries(encodedDayTime);
  console.log(`📊 Found ${scheduleEntries.length} schedule entries`);

  // Format data as tasks array with usns
  const tasks = scheduleEntries
    .filter(entry => entry.room && entry.USNStart && entry.USNEnd)
    .map(entry => ({
      address: entry.room,
      usns: generateUSNArray(entry.USNStart, entry.USNEnd)
    }));

  // Prepare data to send
  const dataToSend = {
    tasks: tasks
  };

  const messageJson = JSON.stringify(dataToSend, null, 2);
  
  // Try to send to master router
  let masterStatus = 'unknown';
  try {
    await sendToMasterRouter(config.master_router_address, messageJson);
    masterStatus = 'online';
  } catch (error) {
    masterStatus = 'offline';
    console.log('\n🔴 MASTER OFFLINE - Data that would have been sent:');
    console.log('═'.repeat(50));
    console.log(messageJson);
    console.log('═'.repeat(50));
  }

  return {
    triggered: true,
    slot,
    time: currentTime,
    day: currentDay,
    dayName: dayNames[currentDay],
    encodedDayTime,
    scheduleEntries,
    masterStatus,
    dataSent: dataToSend
  };
}

// Check if current time matches any slot (called by scheduler)
function checkAndTrigger() {
  const config = loadConfig();
  if (!config) return { triggered: false, slot: null };

  const currentTime = getCurrentTime();
  const slot = getSlotFromTime(currentTime);

  if (slot) {
    // Use async trigger but don't await in the scheduler loop
    triggerSlotCheck().catch(err => console.error('Trigger error:', err.message));
    return { triggered: true, slot, time: currentTime };
  }
  
  return { triggered: false, slot: null, time: currentTime };
}

// Start the scheduler (checks every minute)
function startScheduler() {
  console.log('⏰ Slot scheduler started');
  const config = loadConfig();
  if (config) {
    console.log('📋 Configured slots:', config.slots);
    console.log('🌐 Master router:', config.master_router_address);
  }

  // Check immediately on start
  checkAndTrigger();

  // Then check every minute at the start of each minute
  const now = new Date();
  const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  
  setTimeout(() => {
    checkAndTrigger();
    // Start the regular interval
    setInterval(checkAndTrigger, 60 * 1000);
  }, msUntilNextMinute);
}

// Stop scheduler (for cleanup)
let intervalId = null;
function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('⏰ Slot scheduler stopped');
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndTrigger,
  triggerSlotCheck,
  loadConfig,
  getCurrentTime,
  getCurrentDay,
  getSlotFromTime,
  setSimulatedTime,
  setSimulatedDay,
  clearSimulation,
  getSimulationStatus,
  getScheduleEntries,
  dayNames
};
