const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Helper function to make API calls with error handling
const apiCall = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
};

// Authentication APIs
export const authAPI = {
  register: (userData) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  login: (credentials) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getMe: () => apiCall('/auth/me', { method: 'GET' })
};

// Class Info APIs
export const classAPI = {
  getAllClasses: () => apiCall('/class/classes', { method: 'GET' }),

  getClass: (classId) => 
    apiCall(`/class/classes/${classId}`, { method: 'GET' }),

  addClass: (classData) => 
    apiCall('/class/classes', {
      method: 'POST',
      body: JSON.stringify(classData)
    }),

  updateClass: (classId, classData) => 
    apiCall(`/class/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(classData)
    }),

  deleteClass: (classId) => 
    apiCall(`/class/classes/${classId}`, { method: 'DELETE' }),

  getSchedule: (classId) => 
    apiCall(`/class/classes/${classId}/schedule`, { method: 'GET' }),

  addScheduleEntry: (classId, scheduleData) => 
    apiCall(`/class/classes/${classId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    }),

  bulkUpdateSchedule: (classId, scheduleData) => 
    apiCall(`/class/classes/${classId}/schedule/bulk`, {
      method: 'POST',
      body: JSON.stringify({ scheduleData })
    })
};

// Config APIs (Room-IP Mapper)
export const configAPI = {
  getAllMappings: () => apiCall('/config/room-ip', { method: 'GET' }),

  getMapping: (id) => 
    apiCall(`/config/room-ip/${id}`, { method: 'GET' }),

  addMapping: (mappingData) => 
    apiCall('/config/room-ip', {
      method: 'POST',
      body: JSON.stringify(mappingData)
    }),

  updateMapping: (id, mappingData) => 
    apiCall(`/config/room-ip/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mappingData)
    }),

  deleteMapping: (id) => 
    apiCall(`/config/room-ip/${id}`, { method: 'DELETE' })
};

// Subject APIs
export const subjectAPI = {
  getAllSubjects: (classId) => 
    apiCall(`/subject/classes/${classId}/subjects`, { method: 'GET' }),

  addSubject: (classId, subjectData) => 
    apiCall(`/subject/classes/${classId}/subjects`, {
      method: 'POST',
      body: JSON.stringify(subjectData)
    }),

  updateSubject: (classId, subjectName, subjectData) => 
    apiCall(`/subject/classes/${classId}/subjects/${encodeURIComponent(subjectName)}`, {
      method: 'PUT',
      body: JSON.stringify(subjectData)
    }),

  deleteSubject: (classId, subjectName) => 
    apiCall(`/subject/classes/${classId}/subjects/${encodeURIComponent(subjectName)}`, { 
      method: 'DELETE' 
    }),

  getAllTeachers: () => 
    apiCall('/subject/teachers', { method: 'GET' })
};

// Simulation APIs (for testing slot triggers)
export const simulationAPI = {
  // Get current simulation status
  getStatus: () => apiCall('/simulation/status', { method: 'GET' }),

  // Set simulated time and optionally day (format: "HH:MM", day: 1-6)
  setTime: (time, day = null) => 
    apiCall('/simulation/set-time', {
      method: 'POST',
      body: JSON.stringify({ time, day })
    }),

  // Set simulated day only (1=Monday, 2=Tuesday, ..., 6=Saturday)
  setDay: (day) => 
    apiCall('/simulation/set-day', {
      method: 'POST',
      body: JSON.stringify({ day })
    }),

  // Clear simulation and use real time
  clear: () => 
    apiCall('/simulation/clear', { method: 'POST' }),

  // Trigger a specific slot directly with optional day
  triggerSlot: (slot, day = null) => 
    apiCall('/simulation/trigger-slot', {
      method: 'POST',
      body: JSON.stringify({ slot, day })
    }),

  // Manually trigger the slot check
  trigger: () => 
    apiCall('/simulation/trigger', { method: 'POST' })
};

export default {
  authAPI,
  classAPI,
  configAPI,
  subjectAPI,
  simulationAPI
};
