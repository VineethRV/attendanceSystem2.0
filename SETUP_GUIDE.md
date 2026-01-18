# Attendance Management System - Complete Setup Guide

## Project Structure

```
AttendanceSystem2.0/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   ├── ClassInfo.js         # Class & Schedule Management
│   │   └── Config.js             # Room-IP Configuration
│   ├── components/
│   │   ├── Navbar.js
│   │   └── ProtectedRoute.js
│   ├── services/
│   │   └── api.js                # API client
│   ├── context/
│   │   └── AuthContext.js        # Authentication state
│   ├── App.js
│   ├── index.js
│   └── index.css
├── backend/                       # Node.js/Express backend
│   ├── config/
│   │   └── database.js           # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js               # JWT middleware
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── classInfo.js          # Class endpoints
│   │   └── config.js             # Config endpoints
│   ├── server.js                 # Main server file
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── API_DOCUMENTATION.md
├── package.json                  # Frontend dependencies
└── public/
    └── index.html
```

---

## Prerequisites

Install these before starting:

1. **Node.js** - Download from https://nodejs.org/ (v14 or higher)
2. **MySQL** - Download from https://www.mysql.com/downloads/ (v5.7 or higher)
3. **Git** (optional) - For version control

Verify installations:
```bash
node --version
npm --version
mysql --version
```

---

## Step 1: Database Setup

### 1.1 Start MySQL Server

**Windows:**
```cmd
# If MySQL is installed as a service, it should be running automatically
# Or start it via Services app
# Or use MySQL Workbench
```

**macOS:**
```bash
brew services start mysql
```

**Linux:**
```bash
sudo systemctl start mysql
```

### 1.2 Create Database and Tables

Open MySQL and run these commands:

```sql
-- Create database
CREATE DATABASE attendance_system;
USE attendance_system;

-- Teacher table
CREATE TABLE teacher (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  designation VARCHAR(50),
  email VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Class-Student Mapping table
CREATE TABLE class_student_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class CHAR(5),
  USNStart CHAR(10),
  USNEnd CHAR(10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Class-Room-Time Mapping table
CREATE TABLE class_room_time_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  DTime VARCHAR(10),
  room VARCHAR(15)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Room-IP Mapping table
CREATE TABLE room_ip_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room VARCHAR(15),
  ip VARCHAR(16)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Global Student Attendance table
CREATE TABLE global_student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room VARCHAR(15) NOT NULL,
  DTime VARCHAR(10) NOT NULL,
  attendance CHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Teacher-Student Attendance table
CREATE TABLE teacher_student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class CHAR(5) NOT NULL,
  DTime VARCHAR(10) NOT NULL,
  attendance CHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subject-Time Mapping table
CREATE TABLE subject_time_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class CHAR(5),
  teacher_id INT,
  subject VARCHAR(100),
  DTime VARCHAR(10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd AttendanceSystem2.0/backend
```

### 2.2 Update Environment Variables

Edit the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_system
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=development
```

**Important:** 
- If you didn't set a password for MySQL root user, leave `DB_PASSWORD` empty
- Change `JWT_SECRET` to a strong random string

### 2.3 Install Dependencies

```bash
npm install
```

### 2.4 Start Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on **http://localhost:5000**

Expected output:
```
🚀 Server running on http://localhost:5000
📊 Database: attendance_system
🔐 CORS enabled for http://localhost:3000
✅ MySQL Connected Successfully
```

---

## Step 3: Frontend Setup

### 3.1 Navigate to Root Directory

```bash
cd ..
```

### 3.2 Install Dependencies (if not done already)

```bash
npm install
```

### 3.3 Start Frontend Server

```bash
npm start
```

The frontend will start on **http://localhost:3000** (or next available port)

---

## Step 4: Test the Application

### 4.1 Open in Browser

Navigate to: **http://localhost:3000**

### 4.2 Create a Test Account

1. Click "Register here" on the login page
2. Fill in the registration form:
   - Name: Test Teacher
   - Email: test@example.com
   - Password: password123
   - Designation: Professor
3. Click "Register"

You should be redirected to the dashboard.

### 4.3 Test Class Info Page

1. Click "Class Info" in the navbar
2. Click "+ Add New Class"
3. Fill in:
   - Class Name: CS5A
   - Starting USN: 1RV21CS001
   - Ending USN: 1RV21CS060
   - Default Room: Room101
4. Click "Add Class"
5. Click "View Schedule" to see the 6x6 table
6. Edit some cells to assign different rooms
7. Click "Save Schedule"

### 4.4 Test Config Page

1. Click "Config" in the navbar
2. Click "+ Add New Mapping"
3. Fill in:
   - Room Name: Room101
   - IP Address: 192.168.1.101
4. Click "Add Mapping"

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new teacher
- `POST /api/auth/login` - Login teacher
- `GET /api/auth/me` - Get current teacher

### Classes
- `GET /api/class/classes` - Get all classes
- `POST /api/class/classes` - Add new class
- `PUT /api/class/classes/:id` - Update class
- `DELETE /api/class/classes/:id` - Delete class
- `POST /api/class/classes/:classId/schedule/bulk` - Save schedule

### Configuration
- `GET /api/config/room-ip` - Get all room-IP mappings
- `POST /api/config/room-ip` - Add mapping
- `PUT /api/config/room-ip/:id` - Update mapping
- `DELETE /api/config/room-ip/:id` - Delete mapping

See `backend/API_DOCUMENTATION.md` for complete API documentation.

---

## Troubleshooting

### Backend fails to connect to MySQL

**Error:** `❌ MySQL Connection Error: Access denied for user 'root'@'localhost'`

**Solutions:**
1. Ensure MySQL server is running
2. Check `.env` file has correct credentials
3. Verify database exists: `SHOW DATABASES;`
4. Reset MySQL root password if forgotten

### Frontend can't reach backend

**Error:** `Failed to fetch from API` or CORS error

**Solutions:**
1. Ensure backend is running on port 5000
2. Check `src/services/api.js` has correct API URL
3. Check CORS settings in `backend/server.js`

### Port already in use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

### Dependencies installation fails

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Development Tips

1. **Keep backend running** in one terminal
2. **Keep frontend running** in another terminal
3. **Use browser DevTools** to debug frontend (F12)
4. **Check browser console** for API errors
5. **Use Postman** or **curl** to test APIs directly

### Test API with curl

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

---

## Next Steps

After verifying everything works:

1. **Customize Settings** - Update JWT secret, database settings
2. **Add More Features** - Attendance marking, reports, etc.
3. **Deploy** - Use services like Heroku, AWS, or DigitalOcean
4. **Security** - Enable HTTPS, add rate limiting, etc.

---

## Support & Documentation

- Frontend: [React Documentation](https://react.dev)
- Backend: [Express.js Documentation](https://expressjs.com)
- Database: [MySQL Documentation](https://dev.mysql.com/doc/)
- JWT: [jwt.io](https://jwt.io)

---

## Project Authors & License

This is a learning project. Feel free to modify and use as needed.
