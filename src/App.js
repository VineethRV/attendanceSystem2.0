import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClassInfo from './pages/ClassInfo';
import Config from './pages/Config';
import SubjectManagement from './pages/SubjectManagement';
import SimulationPanel from './pages/SimulationPanel';
import ViewAttendance from './pages/ViewAttendance';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/class-info" element={<ClassInfo />} />
          <Route path="/config" element={<Config />} />
          <Route path="/subject-management/:classId" element={<SubjectManagement />} />
          <Route path="/simulation" element={<SimulationPanel />} />
          <Route path="/view-attendance" element={<ViewAttendance />} />
        </Route>
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
