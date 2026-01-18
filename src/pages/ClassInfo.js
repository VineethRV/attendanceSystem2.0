import React, { useState, useEffect } from 'react';
import { classAPI, configAPI } from '../services/api';

// Days of the week (6 days - Mon to Sat)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Time slots (6 slots)
const TIME_SLOTS = ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5', 'Slot 6'];

const ClassInfo = () => {
  const [classes, setClasses] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [scheduleData, setScheduleData] = useState({});
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roomOptions, setRoomOptions] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomFilter, setRoomFilter] = useState('');
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [activeCellDropdown, setActiveCellDropdown] = useState(null); // Track which cell has open dropdown
  const [cellSearchFilter, setCellSearchFilter] = useState(''); // Track search filter for cell dropdown

  // Form state for adding/editing class
  const [formData, setFormData] = useState({
    className: '',
    usnStart: '',
    usnEnd: '',
    defaultRoom: ''
  });

  // Initialize empty 6x6 schedule
  const createEmptySchedule = (defaultRoom) => {
    const schedule = {};
    DAYS.forEach(day => {
      schedule[day] = {};
      TIME_SLOTS.forEach(slot => {
        schedule[day][slot] = defaultRoom || '';
      });
    });
    return schedule;
  };

  // Load classes on mount
  useEffect(() => {
    loadClasses();
    loadRoomOptions();
  }, []);

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    setError('');
    try {
      const response = await classAPI.getAllClasses();
      setClasses(response.classes || []);
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const loadRoomOptions = async () => {
    setIsLoadingRooms(true);
    try {
      const response = await configAPI.getAllMappings();
      setRoomOptions(response.mappings || []);
    } catch (err) {
      console.error('Failed to load room options:', err);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Filter room options based on user input
  const filteredRoomOptions = roomOptions.filter(room => 
    room.room.toLowerCase().includes(roomFilter.toLowerCase())
  );

  const handleRoomSelect = (room) => {
    setFormData({ ...formData, defaultRoom: room.room });
    setRoomFilter(room.room);
    setShowRoomDropdown(false);
  };

  const handleRoomInputChange = (e) => {
    setRoomFilter(e.target.value);
    setFormData({ ...formData, defaultRoom: e.target.value });
    setShowRoomDropdown(true);
  };

  const handleRoomInputFocus = () => {
    setShowRoomDropdown(true);
  };

  const handleRoomInputBlur = () => {
    // Delay hiding dropdown to allow click on options
    setTimeout(() => setShowRoomDropdown(false), 200);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddClass = () => {
    setFormData({ className: '', usnStart: '', usnEnd: '', defaultRoom: '' });
    setRoomFilter('');
    setEditingClass(null);
    setShowAddModal(true);
  };

  const handleEditClass = (classItem) => {
    setFormData({
      className: classItem.class,
      usnStart: classItem.USNStart,
      usnEnd: classItem.USNEnd,
      defaultRoom: classItem.defaultRoom || ''
    });
    setEditingClass(classItem);
    setShowAddModal(true);
  };

  const handleSaveClass = async () => {
    if (!formData.className || !formData.usnStart || !formData.usnEnd) {
      setError('Please fill in class name and USN range');
      return;
    }

    setError('');
    setIsLoadingClasses(true);

    try {
      let savedClass;
      if (editingClass) {
        // Update existing class
        await classAPI.updateClass(editingClass.id, {
          className: formData.className,
          usnStart: formData.usnStart,
          usnEnd: formData.usnEnd,
          defaultRoom: formData.defaultRoom
        });
        setSuccess('Class updated successfully');
        savedClass = { ...editingClass, defaultRoom: formData.defaultRoom };
      } else {
        // Add new class
        const response = await classAPI.addClass({
          className: formData.className,
          usnStart: formData.usnStart,
          usnEnd: formData.usnEnd,
          defaultRoom: formData.defaultRoom
        });
        setSuccess('Class added successfully');
        savedClass = response.class;
      }
      
      // Reload classes
      await loadClasses();
      setShowAddModal(false);
      setFormData({ className: '', usnStart: '', usnEnd: '', defaultRoom: '' });
      setEditingClass(null);
      
      // Automatically open schedule view for newly added class
      if (savedClass) {
        setTimeout(() => {
          handleViewSchedule(savedClass);
        }, 500);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save class');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    setError('');
    setIsLoadingClasses(true);

    try {
      await classAPI.deleteClass(classId);
      setSuccess('Class deleted successfully');
      await loadClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete class');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleViewSchedule = async (classItem) => {
    setSelectedClass(classItem);
    
    try {
      // Load existing schedule from API
      const schedule = await classAPI.getSchedule(classItem.id);
      
      // If no schedule exists, initialize with default room
      if (!schedule || Object.keys(schedule).length === 0) {
        setScheduleData({
          [classItem.id]: createEmptySchedule(classItem.defaultRoom || '')
        });
      } else {
        setScheduleData({
          [classItem.id]: schedule
        });
      }
    } catch (err) {
      // If API fails, initialize empty schedule
      setScheduleData({
        [classItem.id]: createEmptySchedule(classItem.defaultRoom || '')
      });
    }
    
    setShowScheduleModal(true);
  };

  const handleScheduleChange = (day, slot, value) => {
    if (!selectedClass) return;
    
    setScheduleData({
      ...scheduleData,
      [selectedClass.id]: {
        ...(scheduleData[selectedClass.id] || {}),
        [day]: {
          ...(scheduleData[selectedClass.id]?.[day] || {}),
          [slot]: value
        }
      }
    });
  };

  const handleFillDefaultRoom = () => {
    if (!selectedClass) {
      alert('No class selected');
      return;
    }
    
    // Prompt user to enter a default room if none is set
    let defaultRoom = selectedClass.defaultRoom;
    if (!defaultRoom) {
      defaultRoom = prompt('Enter a default room to fill all cells:');
      if (!defaultRoom || defaultRoom.trim() === '') {
        return; // User cancelled or entered empty string
      }
    }
    
    setScheduleData({
      ...scheduleData,
      [selectedClass.id]: createEmptySchedule(defaultRoom)
    });
  };

  const handleSaveSchedule = async () => {
    if (!selectedClass) return;

    setIsSavingSchedule(true);
    setError('');

    try {
      // Convert schedule to flat format for API
      const flatSchedule = {};
      Object.entries(scheduleData[selectedClass.id] || {}).forEach(([day, slots]) => {
        Object.entries(slots).forEach(([slot, room]) => {
          flatSchedule[`${day}-${slot}`] = room;
        });
      });

      await classAPI.bulkUpdateSchedule(selectedClass.id, flatSchedule);
      setSuccess('Schedule saved successfully');
      setShowScheduleModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Class Information</h1>

      {error && <div className="message message-error">{error}</div>}
      {success && <div className="message message-success">{success}</div>}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn btn-success" onClick={handleAddClass} disabled={isLoadingClasses}>
          + Add New Class
        </button>
      </div>

      {/* Existing Classes */}
      <div className="card">
        <h3 className="card-title">Existing Classes</h3>
        
        {isLoadingClasses ? (
          <p>Loading classes...</p>
        ) : classes.length === 0 ? (
          <p>No classes found. Click "Add New Class" to create one.</p>
        ) : (
          <div className="class-list">
            {classes.map(classItem => (
              <div key={classItem.id} className="class-card">
                <h3>{classItem.class}</h3>
                <p><strong>USN Range:</strong> {classItem.USNStart} - {classItem.USNEnd}</p>
                <p><strong>Default Room:</strong> {classItem.defaultRoom || 'Not set'}</p>
                <p><strong>Students:</strong> {calculateStudentCount(classItem.USNStart, classItem.USNEnd)}</p>
                <div className="class-card-actions">
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => handleViewSchedule(classItem)}
                    disabled={isLoadingClasses}
                  >
                    View Schedule
                  </button>
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => handleEditClass(classItem)}
                    disabled={isLoadingClasses}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteClass(classItem.id)}
                    disabled={isLoadingClasses}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Class Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label>Class Name</label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleInputChange}
                placeholder="e.g., CS5A"
                maxLength={5}
              />
              <small style={{ color: '#666' }}>Max 5 characters</small>
            </div>

            <div className="form-group">
              <label>Starting Roll Number (USN)</label>
              <input
                type="text"
                name="usnStart"
                value={formData.usnStart}
                onChange={handleInputChange}
                placeholder="e.g., 1RV21CS001"
                maxLength={10}
              />
              <small style={{ color: '#666' }}>Inclusive - this USN will be included</small>
            </div>

            <div className="form-group">
              <label>Ending Roll Number (USN)</label>
              <input
                type="text"
                name="usnEnd"
                value={formData.usnEnd}
                onChange={handleInputChange}
                placeholder="e.g., 1RV21CS060"
                maxLength={10}
              />
              <small style={{ color: '#666' }}>Inclusive - this USN will be included</small>
            </div>

            <div className="form-group">
              <label>Default Classroom <small style={{ color: '#999' }}>(Optional)</small></label>
              <div className="dropdown-container">
                <input
                  type="text"
                  value={roomFilter}
                  onChange={handleRoomInputChange}
                  onFocus={handleRoomInputFocus}
                  onBlur={handleRoomInputBlur}
                  placeholder="Type to search rooms..."
                  maxLength={15}
                  disabled={isLoadingRooms}
                />
                {showRoomDropdown && (
                  <div className="dropdown-menu">
                    {isLoadingRooms ? (
                      <div className="dropdown-item">Loading rooms...</div>
                    ) : filteredRoomOptions.length === 0 ? (
                      <div className="dropdown-item">No rooms found. Configure rooms in Config page.</div>
                    ) : (
                      filteredRoomOptions.map(room => (
                        <div
                          key={room.id}
                          className="dropdown-item"
                          onClick={() => handleRoomSelect(room)}
                        >
                          {room.room} (IP: {room.ip})
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <small style={{ color: '#666' }}>Select from configured room-IP mappings (or leave empty)</small>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleSaveClass} disabled={isLoadingClasses}>
                {editingClass ? 'Update Class' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal (6x6 Table) */}
      {showScheduleModal && selectedClass && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h3>Classroom Schedule - {selectedClass.class}</h3>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <button className="btn btn-secondary btn-small" onClick={handleFillDefaultRoom}>
                Fill All with Default Room
              </button>
            </div>

            {/* Schedule Table */}
            <div className="schedule-table table-container">
              <table>
                <thead>
                  <tr>
                    <th>Day / Time</th>
                    {TIME_SLOTS.map(slot => (
                      <th key={slot}>{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      <td><strong>{day}</strong></td>
                      {TIME_SLOTS.map(slot => {
                        const cellId = `${day}-${slot}`;
                        const isActive = activeCellDropdown === cellId;
                        const filteredRooms = roomOptions.filter(room =>
                          room.room.toLowerCase().includes(cellSearchFilter.toLowerCase())
                        );
                        const cellValue = scheduleData[selectedClass.id]?.[day]?.[slot] || '';

                        return (
                          <td key={cellId} style={{ position: 'relative' }}>
                            <div className="dropdown-container" style={{ position: 'relative', width: '100%' }}>
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(e) => {
                                  handleScheduleChange(day, slot, e.target.value);
                                  setCellSearchFilter(e.target.value);
                                }}
                                onFocus={() => {
                                  setActiveCellDropdown(cellId);
                                  setCellSearchFilter('');
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setActiveCellDropdown(null);
                                    setCellSearchFilter('');
                                  }, 200);
                                }}
                                placeholder="Click to select"
                                maxLength={15}
                                style={{
                                  width: '100%',
                                  padding: '6px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              />
                              {isActive && roomOptions.length > 0 && (
                                <div
                                  className="dropdown-menu"
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    zIndex: 1000
                                  }}
                                >
                                  {filteredRooms.length > 0 ? (
                                    filteredRooms.map(room => (
                                      <div
                                        key={room.id}
                                        className="dropdown-item"
                                        onClick={() => {
                                          handleScheduleChange(day, slot, room.room);
                                          setActiveCellDropdown(null);
                                          setCellSearchFilter('');
                                        }}
                                        style={{
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          borderBottom: '1px solid #f0f0f0',
                                          fontSize: '12px'
                                        }}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                      >
                                        {room.room} <small style={{ color: '#999' }}>({room.ip})</small>
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '8px', color: '#999', fontSize: '12px' }}>
                                      No rooms found
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '15px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
              <small>
                <strong>Note:</strong> Edit each cell to assign a classroom to the day/time slot.
              </small>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>
                Close
              </button>
              <button className="btn btn-success" onClick={handleSaveSchedule} disabled={isSavingSchedule}>
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate student count from USN range
const calculateStudentCount = (usnStart, usnEnd) => {
  try {
    const startNum = parseInt(usnStart.slice(-3));
    const endNum = parseInt(usnEnd.slice(-3));
    if (!isNaN(startNum) && !isNaN(endNum)) {
      return endNum - startNum + 1; // +1 because both are inclusive
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return 'N/A';
};

export default ClassInfo;
