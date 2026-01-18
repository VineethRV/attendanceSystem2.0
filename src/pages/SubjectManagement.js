import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectAPI, classAPI } from '../services/api';
import '../styles/SubjectManagement.css';

// Days of the week (6 days)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NUMBERS = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

// Time slots (6 slots)
const TIME_SLOTS = ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5', 'Slot 6'];
const SLOT_NUMBERS = { 'Slot 1': 1, 'Slot 2': 2, 'Slot 3': 3, 'Slot 4': 4, 'Slot 5': 5, 'Slot 6': 6 };

const SubjectManagement = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [className, setClassName] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Occupied slots (from existing subjects)
  const [occupiedSlots, setOccupiedSlots] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    subjectName: '',
    teacherId: '',
    selectedSlots: {} // { 'Monday-Slot 1': true, ... }
  });

  useEffect(() => {
    loadClassInfo();
    loadTeachers();
    loadSubjects();
  }, [classId]);

  const loadClassInfo = async () => {
    try {
      const response = await classAPI.getClass(classId);
      setClassName(response.class?.class || '');
    } catch (err) {
      console.error('Error loading class:', err);
    }
  };

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const response = await subjectAPI.getAllTeachers();
      setTeachers(response.teachers || []);
    } catch (err) {
      setError('Failed to load teachers');
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    setError('');
    try {
      const response = await subjectAPI.getAllSubjects(classId);
      setSubjects(response.subjects || []);
      setClassName(response.className || className);
      
      // Build occupied slots map
      const occupied = {};
      (response.subjects || []).forEach(subject => {
        subject.slots.forEach(slot => {
          const key = `${slot.day}-${slot.slot}`;
          occupied[key] = {
            subject: subject.subject,
            teacher: subject.teacher_name
          };
        });
      });
      setOccupiedSlots(occupied);
    } catch (err) {
      setError('Failed to load subjects');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setFormData({
      subjectName: '',
      teacherId: '',
      selectedSlots: {}
    });
    setShowAddModal(true);
    setError('');
    setSuccess('');
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    
    // Build selected slots map from subject slots
    const selectedSlots = {};
    subject.slots.forEach(slot => {
      const key = `${slot.day}-${slot.slot}`;
      selectedSlots[key] = true;
    });
    
    setFormData({
      subjectName: subject.subject,
      teacherId: subject.teacher_id,
      selectedSlots: selectedSlots
    });
    setShowAddModal(true);
    setError('');
    setSuccess('');
  };

  const handleSlotToggle = (day, slot) => {
    const key = `${DAY_NUMBERS[day]}-${SLOT_NUMBERS[slot]}`;
    
    // Check if slot is occupied by another subject (not the one being edited)
    if (occupiedSlots[key] && 
        (!editingSubject || occupiedSlots[key].subject !== editingSubject.subject)) {
      return; // Can't select occupied slot
    }
    
    setFormData(prev => ({
      ...prev,
      selectedSlots: {
        ...prev.selectedSlots,
        [key]: !prev.selectedSlots[key]
      }
    }));
  };

  const handleSaveSubject = async () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.subjectName.trim()) {
      setError('Subject name is required');
      return;
    }
    
    if (!formData.teacherId) {
      setError('Please select a teacher');
      return;
    }
    
    const selectedSlotKeys = Object.keys(formData.selectedSlots).filter(
      key => formData.selectedSlots[key]
    );
    
    if (selectedSlotKeys.length === 0) {
      setError('Please select at least one time slot');
      return;
    }
    
    // Convert selected slots to array format
    const slots = selectedSlotKeys.map(key => {
      const [day, slot] = key.split('-').map(Number);
      return { day, slot };
    });
    
    const subjectData = {
      subject: formData.subjectName.trim(),
      teacher_id: parseInt(formData.teacherId),
      slots: slots
    };
    
    try {
      if (editingSubject) {
        // Update existing subject
        await subjectAPI.updateSubject(
          classId, 
          editingSubject.subject, 
          {
            newSubjectName: subjectData.subject,
            teacher_id: subjectData.teacher_id,
            slots: subjectData.slots
          }
        );
        setSuccess('Subject updated successfully');
      } else {
        // Add new subject
        await subjectAPI.addSubject(classId, subjectData);
        setSuccess('Subject added successfully');
      }
      
      setShowAddModal(false);
      loadSubjects();
    } catch (err) {
      setError(err.message || 'Failed to save subject');
    }
  };

  const handleDeleteSubject = async (subjectName) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"?`)) {
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      await subjectAPI.deleteSubject(classId, subjectName);
      setSuccess('Subject deleted successfully');
      loadSubjects();
    } catch (err) {
      setError(err.message || 'Failed to delete subject');
    }
  };

  const isSlotOccupied = (day, slot) => {
    const key = `${DAY_NUMBERS[day]}-${SLOT_NUMBERS[slot]}`;
    return occupiedSlots[key] && 
           (!editingSubject || occupiedSlots[key].subject !== editingSubject.subject);
  };

  const isSlotSelected = (day, slot) => {
    const key = `${DAY_NUMBERS[day]}-${SLOT_NUMBERS[slot]}`;
    return formData.selectedSlots[key] === true;
  };

  const getSlotInfo = (day, slot) => {
    const key = `${DAY_NUMBERS[day]}-${SLOT_NUMBERS[slot]}`;
    return occupiedSlots[key];
  };

  return (
    <div className="subject-management-container">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate('/class-info')}>
          ← Back to Classes
        </button>
        <h2>Subject Management - {className}</h2>
        <button className="btn btn-primary" onClick={handleAddSubject}>
          + Add Subject
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isLoadingSubjects ? (
        <div className="loading">Loading subjects...</div>
      ) : (
        <div className="subjects-list">
          <h3>Existing Subjects</h3>
          {subjects.length === 0 ? (
            <p className="no-data">No subjects added yet. Click "Add Subject" to get started.</p>
          ) : (
            <div className="subjects-grid">
              {subjects.map((subject, idx) => (
                <div key={idx} className="subject-card">
                  <div className="subject-header">
                    <h4>{subject.subject}</h4>
                    <div className="subject-actions">
                      <button 
                        className="btn btn-small btn-secondary" 
                        onClick={() => handleEditSubject(subject)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-small btn-danger" 
                        onClick={() => handleDeleteSubject(subject.subject)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="subject-teacher">
                    <strong>Teacher:</strong> {subject.teacher_name || 'N/A'}
                  </p>
                  <div className="subject-slots">
                    <strong>Time Slots:</strong>
                    <ul>
                      {subject.slots.map((slot, slotIdx) => (
                        <li key={slotIdx}>
                          Day {slot.day}, Slot {slot.slot}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal subject-modal">
            <div className="modal-header">
              <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Teacher *</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.designation ? `(${teacher.designation})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Time Slots * (Select one or more)</label>
                <p className="help-text">Click on cells to select time slots for this subject.</p>
                
                <div className="slot-matrix-container">
                  <table className="slot-matrix">
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
                          <td className="day-label"><strong>{day}</strong></td>
                          {TIME_SLOTS.map(slot => {
                            const occupied = isSlotOccupied(day, slot);
                            const selected = isSlotSelected(day, slot);
                            const slotInfo = getSlotInfo(day, slot);
                            
                            return (
                              <td 
                                key={`${day}-${slot}`}
                                className={`slot-cell ${selected ? 'selected' : ''} ${occupied ? 'occupied' : ''}`}
                                onClick={() => !occupied && handleSlotToggle(day, slot)}
                                title={occupied ? `Occupied by ${slotInfo.subject}` : 'Click to select'}
                              >
                                {occupied ? (
                                  <div className="occupied-info">
                                    <small>{slotInfo.subject}</small>
                                  </div>
                                ) : (
                                  <div className="checkbox-container">
                                    {selected && <span className="checkmark">✓</span>}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="legend">
                  <div className="legend-item">
                    <div className="legend-box selected"></div>
                    <span>Selected</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box occupied"></div>
                    <span>Occupied by other subject</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box available"></div>
                    <span>Available</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveSubject}>
                {editingSubject ? 'Update Subject' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
