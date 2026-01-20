const express = require('express');
const router = express.Router();
const { 
  setSimulatedTime,
  setSimulatedDay, 
  clearSimulation, 
  getSimulationStatus,
  triggerSlotCheck,
  dayNames
} = require('../services/slotScheduler');

// GET /api/simulation/status - Get current simulation status
router.get('/status', (req, res) => {
  try {
    const status = getSimulationStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Error getting simulation status', error: error.message });
  }
});

// POST /api/simulation/set-time - Set simulated time and optionally day
// Body: { "time": "09:00", "day": 1 } (day is optional, 1=Monday, 2=Tuesday, etc.)
router.post('/set-time', async (req, res) => {
  try {
    const { time, day } = req.body;
    
    if (!time) {
      return res.status(400).json({ message: 'Time is required. Format: HH:MM' });
    }
    
    const result = await setSimulatedTime(time, day);
    res.json({ 
      message: `Simulation time set to ${time}${day ? ` on ${dayNames[day]}` : ''}`,
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/simulation/set-day - Set simulated day only
// Body: { "day": 1 } (1=Monday, 2=Tuesday, ..., 6=Saturday)
router.post('/set-day', (req, res) => {
  try {
    const { day } = req.body;
    
    if (!day) {
      return res.status(400).json({ 
        message: 'Day is required. 1=Monday, 2=Tuesday, ..., 6=Saturday',
        dayOptions: dayNames
      });
    }
    
    const result = setSimulatedDay(day);
    res.json({ 
      message: `Simulation day set to ${dayNames[day]}`,
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/simulation/clear - Clear simulation and use real time
router.post('/clear', (req, res) => {
  try {
    clearSimulation();
    const status = getSimulationStatus();
    res.json({ 
      message: 'Simulation cleared. Using real time.',
      ...status
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing simulation', error: error.message });
  }
});

// POST /api/simulation/trigger-slot - Trigger a specific slot directly
// Body: { "slot": "1", "day": 1 } (day is optional)
router.post('/trigger-slot', async (req, res) => {
  try {
    const { slot, day } = req.body;
    
    if (!slot) {
      return res.status(400).json({ message: 'Slot number is required' });
    }
    
    const status = getSimulationStatus();
    const slotTime = status.slots[String(slot)];
    
    if (!slotTime) {
      return res.status(400).json({ 
        message: `Slot ${slot} not found`, 
        availableSlots: Object.keys(status.slots) 
      });
    }
    
    const result = await setSimulatedTime(slotTime, day);
    res.json({
      message: `Triggered slot ${slot} at ${slotTime}${day ? ` on ${dayNames[day]}` : ''}`,
      slot,
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/simulation/trigger - Manually trigger the slot check
router.post('/trigger', async (req, res) => {
  try {
    const result = await triggerSlotCheck();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error triggering check', error: error.message });
  }
});

module.exports = router;
