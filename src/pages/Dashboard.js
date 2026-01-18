import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>

      <div className="card">
        <h3 className="card-title">Welcome, {user?.name || 'Teacher'}!</h3>
        <p>
          Welcome to the Attendance Management System. Use the navigation menu to access different features.
        </p>
      </div>

      <div className="class-list">
        <div className="class-card">
          <h3>📚 Class Info</h3>
          <p>Manage class-student mappings and classroom schedules.</p>
          <p style={{ marginTop: '10px' }}>
            <a href="/class-info" style={{ color: '#667eea' }}>Go to Class Info →</a>
          </p>
        </div>

        <div className="class-card">
          <h3>⚙️ Configuration</h3>
          <p>Configure room-IP mappings for attendance devices.</p>
          <p style={{ marginTop: '10px' }}>
            <a href="/config" style={{ color: '#667eea' }}>Go to Config →</a>
          </p>
        </div>

        <div className="class-card">
          <h3>👤 Profile</h3>
          <p>View and manage your profile information.</p>
          <p style={{ marginTop: '10px', color: '#666' }}>
            Email: {user?.email}<br />
            Designation: {user?.designation || 'Not set'}
          </p>
        </div>
      </div>

      <div className="card" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
        <h4 style={{ marginBottom: '10px' }}>Quick Start Guide</h4>
        <ol style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li><strong>Class Info:</strong> Add classes with student USN ranges and set up classroom schedules.</li>
          <li><strong>Config:</strong> Map room names to IP addresses for attendance tracking devices.</li>
          <li>Once configured, the system will automatically track attendance based on schedules.</li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
