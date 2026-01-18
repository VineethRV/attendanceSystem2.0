import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        📋 Attendance System
      </Link>
      
      <ul className="navbar-nav">
        <li>
          <Link to="/dashboard" className={isActive('/dashboard')}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/class-info" className={isActive('/class-info')}>
            Class Info
          </Link>
        </li>
        <li>
          <Link to="/config" className={isActive('/config')}>
            Config
          </Link>
        </li>
      </ul>

      <div className="navbar-user">
        <span>👤 {user?.name || 'Teacher'}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
