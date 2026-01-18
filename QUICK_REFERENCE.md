# Quick Reference Guide

## Running the Application

### Terminal 1 - Backend Server
```bash
cd AttendanceSystem2.0/backend
npm start
# Runs on http://localhost:5000
```

### Terminal 2 - Frontend Server
```bash
cd AttendanceSystem2.0
npm start
# Runs on http://localhost:3000
```

---

## Frontend File Locations

| Page | File |
|------|------|
| Login | `src/pages/Login.js` |
| Register | `src/pages/Register.js` |
| Dashboard | `src/pages/Dashboard.js` |
| Class Info | `src/pages/ClassInfo.js` |
| Configuration | `src/pages/Config.js` |
| API Service | `src/services/api.js` |
| Auth Context | `src/context/AuthContext.js` |

---

## Backend File Locations

| Component | File |
|-----------|------|
| Main Server | `backend/server.js` |
| Database Config | `backend/config/database.js` |
| Auth Routes | `backend/routes/auth.js` |
| Class Routes | `backend/routes/classInfo.js` |
| Config Routes | `backend/routes/config.js` |
| Auth Middleware | `backend/middleware/auth.js` |
| Environment | `backend/.env` |

---

## Database Connection

**File:** `backend/.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=              # Your MySQL password
DB_NAME=attendance_system
DB_PORT=3306
```

---

## Key API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me (requires token)
```

### Classes
```
GET /api/class/classes (requires token)
POST /api/class/classes (requires token)
PUT /api/class/classes/:id (requires token)
DELETE /api/class/classes/:id (requires token)
POST /api/class/classes/:classId/schedule/bulk (requires token)
```

### Room-IP Mapper
```
GET /api/config/room-ip (requires token)
POST /api/config/room-ip (requires token)
PUT /api/config/room-ip/:id (requires token)
DELETE /api/config/room-ip/:id (requires token)
```

---

## Database Schema

### teacher
- id (PRIMARY KEY)
- name
- hashed_password
- designation
- email (UNIQUE)

### class_student_map
- id (PRIMARY KEY)
- class (CHAR 5)
- USNStart (CHAR 10)
- USNEnd (CHAR 10)

### class_room_time_map
- id (PRIMARY KEY)
- DTime (VARCHAR 10) - Format: "Day-Slot"
- room (VARCHAR 15)

### room_ip_map
- id (PRIMARY KEY)
- room (VARCHAR 15)
- ip (VARCHAR 16)

---

## Common Tasks

### Test Backend API
```bash
# Using curl
curl http://localhost:5000/api/health

# Using Postman
# Open Postman, set method to GET
# Enter: http://localhost:5000/api/health
# Click Send
```

### Check if Ports are in Use
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :5000
lsof -i :3000
```

### Kill Process on Port
```bash
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

### View MySQL Databases
```bash
mysql -u root -p
SHOW DATABASES;
USE attendance_system;
SHOW TABLES;
```

---

## Frontend State Management

### AuthContext (src/context/AuthContext.js)
- `user` - Current logged-in teacher
- `login(credentials)` - Login with email/password
- `logout()` - Logout current user
- `register(userData)` - Register new teacher
- `loading` - Loading state
- `error` - Error message

---

## API Service (src/services/api.js)

```javascript
import { authAPI, classAPI, configAPI } from './services/api';

// Authentication
await authAPI.login({ email, password });
await authAPI.register({ name, email, password, designation });

// Classes
await classAPI.getAllClasses();
await classAPI.addClass({ className, usnStart, usnEnd });
await classAPI.updateClass(id, { ... });
await classAPI.deleteClass(id);
await classAPI.bulkUpdateSchedule(classId, scheduleData);

// Config
await configAPI.getAllMappings();
await configAPI.addMapping({ room, ip });
await configAPI.updateMapping(id, { room, ip });
await configAPI.deleteMapping(id);
```

---

## Data Flow

```
User Registration/Login
         ↓
[Login.js/Register.js] → API Call
         ↓
[backend/routes/auth.js] → Validate → Hash Password
         ↓
[MySQL: teacher table]
         ↓
Return JWT Token
         ↓
[AuthContext] → Store token & user in localStorage
         ↓
[Protected Routes] → Redirect to Dashboard
```

---

## 6×6 Schedule Format

The schedule table is 6 days × 6 time slots:

**Days:** Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
**Slots:** Slot 1, Slot 2, Slot 3, Slot 4, Slot 5, Slot 6

**Storage Format:** `"Monday-Slot 1": "Room101"`

---

## Tips for Development

1. **Always start backend first** - Frontend needs it for API calls
2. **Check browser console** (F12) for JavaScript errors
3. **Check backend console** for API errors
4. **Test APIs with Postman** before testing in UI
5. **Use network tab** (DevTools) to see API requests
6. **Keep .env secure** - Don't commit passwords to git

---

## Next Features to Add

- [ ] Attendance marking functionality
- [ ] Report generation
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Student portal
- [ ] Statistics & analytics
- [ ] Database backups

---

## Support Documents

- `SETUP_GUIDE.md` - Complete setup instructions
- `backend/API_DOCUMENTATION.md` - Detailed API reference
- `README.md` - Project overview

---

**Last Updated:** January 2026
