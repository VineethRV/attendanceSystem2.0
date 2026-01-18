import React, { useState, useEffect } from 'react';
import { configAPI } from '../services/api';

const Config = () => {
  const [roomIpMappings, setRoomIpMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [formData, setFormData] = useState({
    room: '',
    ip: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load mappings on mount
  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await configAPI.getAllMappings();
      setRoomIpMappings(response.mappings || []);
    } catch (err) {
      setError(err.message || 'Failed to load mappings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateIpAddress = (ip) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  };

  const handleAddMapping = () => {
    setFormData({ room: '', ip: '' });
    setEditingMapping(null);
    setError('');
    setShowAddModal(true);
  };

  const handleEditMapping = (mapping) => {
    setFormData({
      room: mapping.room,
      ip: mapping.ip
    });
    setEditingMapping(mapping);
    setError('');
    setShowAddModal(true);
  };

  const handleSaveMapping = async () => {
    // Validation
    if (!formData.room.trim()) {
      setError('Room name is required');
      return;
    }

    if (!formData.ip.trim()) {
      setError('IP address is required');
      return;
    }

    if (!validateIpAddress(formData.ip)) {
      setError('Please enter a valid IP address (e.g., 192.168.1.100)');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (editingMapping) {
        // Update existing mapping
        await configAPI.updateMapping(editingMapping.id, {
          room: formData.room,
          ip: formData.ip
        });
        setSuccess('Mapping updated successfully');
      } else {
        // Add new mapping
        await configAPI.addMapping({
          room: formData.room,
          ip: formData.ip
        });
        setSuccess('Mapping added successfully');
      }
      
      // Reload mappings
      await loadMappings();
      setShowAddModal(false);
      setFormData({ room: '', ip: '' });
      setEditingMapping(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save mapping');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!window.confirm('Are you sure you want to delete this room-IP mapping?')) return;

    setError('');
    setIsLoading(true);

    try {
      await configAPI.deleteMapping(mappingId);
      setSuccess('Mapping deleted successfully');
      await loadMappings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete mapping');
    } finally {
      setIsLoading(false);
    }
  };

  // Inline editing for quick changes
  const handleInlineEdit = async (id, field, value) => {
    const mapping = roomIpMappings.find(m => m.id === id);
    if (!mapping) return;

    const updatedData = { ...mapping, [field]: value };

    setError('');
    setIsLoading(true);

    try {
      if (!validateIpAddress(updatedData.ip)) {
        setError('Please enter a valid IP address');
        setIsLoading(false);
        return;
      }

      await configAPI.updateMapping(id, {
        room: updatedData.room,
        ip: updatedData.ip
      });
      
      await loadMappings();
      setSuccess('Mapping updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update mapping');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Configuration - Room IP Mapper</h1>

      {error && <div className="message message-error">{error}</div>}
      {success && <div className="message message-success">{success}</div>}

      {/* Info Card */}
      <div className="card" style={{ background: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
        <p>
          <strong>Room IP Mapper:</strong> Configure the IP addresses associated with each classroom. 
          These mappings are used to identify which ESP32/camera device is installed in each room 
          for automatic attendance tracking.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn btn-success" onClick={handleAddMapping} disabled={isLoading}>
          + Add New Mapping
        </button>
      </div>

      {/* Room IP Mappings Table */}
      <div className="card">
        <h3 className="card-title">Room - IP Address Mappings</h3>
        
        {isLoading ? (
          <p>Loading mappings...</p>
        ) : roomIpMappings.length === 0 ? (
          <p>No room-IP mappings found. Click "Add New Mapping" to create one.</p>
        ) : (
          <div className="table-container">
            <table className="config-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>#</th>
                  <th>Room Name</th>
                  <th>IP Address</th>
                  <th style={{ width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomIpMappings.map((mapping, index) => (
                  <tr key={mapping.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={mapping.room}
                        onChange={(e) => handleInlineEdit(mapping.id, 'room', e.target.value)}
                        maxLength={15}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={mapping.ip}
                        onChange={(e) => handleInlineEdit(mapping.id, 'ip', e.target.value)}
                        maxLength={16}
                      />
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEditMapping(mapping)}
                        style={{ marginRight: '10px' }}
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="card">
        <h3 className="card-title">Summary</h3>
        <p><strong>Total Rooms Configured:</strong> {roomIpMappings.length}</p>
        <div style={{ marginTop: '15px' }}>
          <h4>Configured Rooms:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {roomIpMappings.map(m => (
              <span 
                key={m.id}
                style={{
                  background: '#667eea',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}
              >
                {m.room}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingMapping ? 'Edit Room-IP Mapping' : 'Add New Room-IP Mapping'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {error && <div className="message message-error">{error}</div>}
            
            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleInputChange}
                placeholder="e.g., Room101"
                maxLength={15}
              />
              <small style={{ color: '#666' }}>Max 15 characters</small>
            </div>

            <div className="form-group">
              <label>IP Address</label>
              <input
                type="text"
                name="ip"
                value={formData.ip}
                onChange={handleInputChange}
                placeholder="e.g., 192.168.1.101"
                maxLength={16}
              />
              <small style={{ color: '#666' }}>IPv4 address of the device in this room</small>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={isLoading}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleSaveMapping} disabled={isLoading}>
                {editingMapping ? 'Update Mapping' : 'Add Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Config;
