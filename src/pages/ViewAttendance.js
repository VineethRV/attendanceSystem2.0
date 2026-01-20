import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ViewAttendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const data = await api.attendanceAPI.getTeacherClasses();
      setClasses(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching classes');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = async (className) => {
    try {
      setLoading(true);
      const data = await api.attendanceAPI.getClassAttendance(className);
      setAttendanceData(data);
      setSelectedClass(className);
      setError('');
    } catch (err) {
      setError(err.message || 'Error fetching attendance data');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setAttendanceData(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'P':
        return '#28a745'; // Green for present
      case 'A':
        return '#dc3545'; // Red for absent
      case 'L':
        return '#ffc107'; // Yellow for late
      default:
        return '#6c757d'; // Gray for unknown
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="page-container">
        <h1 className="page-title">View Attendance</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">View Attendance</h1>

      {error && (
        <div className="message message-error">{error}</div>
      )}

      {!selectedClass ? (
        // Class Selection View
        <div className="card">
          <h2 className="card-title">Your Classes</h2>
          {classes.length === 0 ? (
            <p>No classes assigned to you.</p>
          ) : (
            <div className="class-list">
              {classes.map((classItem) => (
                <div
                  key={classItem.class}
                  className="class-card"
                  onClick={() => handleClassClick(classItem.class)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>{classItem.class}</h3>
                  <p><strong>Students:</strong> {classItem.USNStart} - {classItem.USNEnd}</p>
                  {classItem.defaultRoom && (
                    <p><strong>Room:</strong> {classItem.defaultRoom}</p>
                  )}
                  <button className="btn btn-primary btn-small" style={{ marginTop: '10px' }}>
                    View Attendance
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Attendance Table View
        <div>
          <button className="btn btn-secondary" onClick={handleBackToClasses} style={{ marginBottom: '20px' }}>
            ← Back to Classes
          </button>

          <div className="card">
            <h2 className="card-title">Attendance for {selectedClass}</h2>

            {loading ? (
              <p>Loading attendance data...</p>
            ) : (
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Attendance table will be displayed here.
              </p>
            )}

            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px' }}>Legend:</h4>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#28a745' }}>P</div>
                  <span>Present</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#dc3545' }}>A</div>
                  <span>Absent</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#6c757d' }}>-</div>
                  <span>No record</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewAttendance;
