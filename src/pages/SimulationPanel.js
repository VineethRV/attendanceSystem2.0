import React, { useState, useEffect } from 'react';
import { simulationAPI } from '../services/api';

const SimulationPanel = () => {
  const [status, setStatus] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await simulationAPI.getStatus();
      setStatus(data);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSetTime = async () => {
    if (!customTime) {
      setMessage('Please enter a time');
      return;
    }
    setLoading(true);
    try {
      const data = await simulationAPI.setTime(customTime);
      setMessage(data.message);
      setStatus(prev => ({ ...prev, simulationMode: true, simulatedTime: data.simulatedTime }));
      if (data.triggered) {
        setMessage(`✅ ${data.message} - Slot ${data.triggered.slot} was triggered!`);
      }
      fetchStatus();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleTriggerSlot = async (slot) => {
    setLoading(true);
    try {
      const data = await simulationAPI.triggerSlot(slot);
      setMessage(`✅ ${data.message}`);
      fetchStatus();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleClearSimulation = async () => {
    setLoading(true);
    try {
      const data = await simulationAPI.clear();
      setMessage(data.message);
      fetchStatus();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🕐 Time Simulation Panel</h2>
      
      {/* Status Display */}
      {status && (
        <div style={styles.statusBox}>
          <p><strong>Mode:</strong> {status.simulationMode ? '🔧 Simulation' : '⏰ Real Time'}</p>
          <p><strong>Real Time:</strong> {status.realTime}</p>
          {status.simulationMode && (
            <p><strong>Simulated Time:</strong> {status.simulatedTime}</p>
          )}
          <p><strong>Active Time:</strong> {status.activeTime}</p>
          <p><strong>Master Router:</strong> {status.masterRouterAddress}</p>
        </div>
      )}

      {/* Custom Time Input */}
      <div style={styles.section}>
        <h3>Set Custom Time</h3>
        <div style={styles.inputGroup}>
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            style={styles.input}
          />
          <button 
            onClick={handleSetTime} 
            disabled={loading}
            style={styles.button}
          >
            Set Time
          </button>
        </div>
      </div>

      {/* Quick Slot Triggers */}
      <div style={styles.section}>
        <h3>Quick Trigger Slots</h3>
        <div style={styles.slotGrid}>
          {status?.slots && Object.entries(status.slots).map(([slot, time]) => (
            <button
              key={slot}
              onClick={() => handleTriggerSlot(slot)}
              disabled={loading}
              style={styles.slotButton}
            >
              Slot {slot}<br />
              <small>{time}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Simulation */}
      <div style={styles.section}>
        <button 
          onClick={handleClearSimulation} 
          disabled={loading}
          style={styles.clearButton}
        >
          🔄 Clear Simulation (Use Real Time)
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '20px auto',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333'
  },
  statusBox: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ddd'
  },
  section: {
    marginBottom: '20px'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    flex: 1
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px'
  },
  slotButton: {
    padding: '15px 10px',
    fontSize: '14px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center'
  },
  clearButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  message: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    borderRadius: '5px',
    textAlign: 'center',
    border: '1px solid #b3d7ff'
  }
};

export default SimulationPanel;
