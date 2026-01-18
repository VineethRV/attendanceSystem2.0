# System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     BROWSER (Client Side)                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │          React Frontend (Port 3000)                    │   │
│  │                                                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Login Page  │  │ ClassInfo    │  │   Config   │  │   │
│  │  │ Register     │  │ Dashboard    │  │   Page     │  │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  │        ↓                  ↓                  ↓         │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │   API Service Layer (api.js)                  │  │   │
│  │  │  authAPI, classAPI, configAPI                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │        ↓                  ↓                  ↓         │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │   Auth Context (AuthContext.js)               │  │   │
│  │  │   - User State                                │  │   │
│  │  │   - Token Management                          │  │   │
│  │  │   - Login/Logout/Register                      │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │        ↓              ↓              ↓               │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │   LocalStorage                                │  │   │
│  │  │   - user (JSON)                               │  │   │
│  │  │   - authToken (JWT)                           │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓ (HTTPS/REST API)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│               Node.js + Express Backend (Port 5000)            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Express Server & CORS Configuration                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              Routes & Controllers                     │   │
│  │                                                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  auth.js     │  │ classInfo.js │  │ config.js  │  │   │
│  │  │              │  │              │  │            │  │   │
│  │  │ - register   │  │ - getClasses │  │ - getMaps  │  │   │
│  │  │ - login      │  │ - addClass   │  │ - addMap   │  │   │
│  │  │ - getMe      │  │ - updateCl.. │  │ - updateM..│  │   │
│  │  │              │  │ - deleteCl.. │  │ - deleteM..│  │   │
│  │  │              │  │ - Schedule   │  │            │  │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Authentication Middleware (auth.js)                  │   │
│  │  - Verify JWT Token                                  │   │
│  │  - Check Authorization                               │   │
│  │  - Attach user to request                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Security & Validation                                │   │
│  │  - Input Validation                                   │   │
│  │  - Password Hashing (bcryptjs)                        │   │
│  │  - SQL Injection Prevention                           │   │
│  │  - Error Handling                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                             ↓                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Database Connection (database.js)                    │   │
│  │  - MySQL Connection Pool                              │   │
│  │  - Query Execution                                    │   │
│  │  - Error Handling                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓ (SQL)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    MySQL Database (Port 3306)                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Database: attendance_system                          │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │ Tables:                                        │   │   │
│  │  │                                                │   │   │
│  │  │ ├─ teacher                                     │   │   │
│  │  │ │  ├─ id, name, email, designation            │   │   │
│  │  │ │  └─ hashed_password                          │   │   │
│  │  │ │                                              │   │   │
│  │  │ ├─ class_student_map                           │   │   │
│  │  │ │  ├─ id, class, USNStart, USNEnd             │   │   │
│  │  │ │                                              │   │   │
│  │  │ ├─ class_room_time_map                         │   │   │
│  │  │ │  ├─ id, DTime, room                          │   │   │
│  │  │ │                                              │   │   │
│  │  │ ├─ room_ip_map                                 │   │   │
│  │  │ │  ├─ id, room, ip                             │   │   │
│  │  │ │                                              │   │   │
│  │  │ ├─ global_student_attendance                   │   │   │
│  │  │ ├─ teacher_student_attendance                  │   │   │
│  │  │ └─ subject_time_map                            │   │   │
│  │  │                                                │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Flow

### 1. Authentication Flow

```
User visits localhost:3000
         ↓
Check LocalStorage for token & user
         ↓
         ├─ Token exists? Yes → Go to Dashboard
         │
         └─ No → Show Login Page
                  ↓
                  User enters credentials
                  ↓
                  Submit to /api/auth/login
                  ↓
                  Backend: Hash password & verify
                  ↓
                  Return JWT token
                  ↓
                  Store token & user in LocalStorage
                  ↓
                  Redirect to Dashboard
```

---

### 2. Class Management Flow

```
User clicks "Class Info" in Navbar
         ↓
Fetch from /api/class/classes (with JWT token)
         ↓
Backend: Verify token → Query database
         ↓
Return classes from class_student_map table
         ↓
Display classes in React component
         ↓
User clicks "Add New Class"
         ↓
Show Modal Form
         ↓
User enters: className, usnStart, usnEnd, defaultRoom
         ↓
Submit to /api/class/classes (POST)
         ↓
Backend: Validate → Insert into database
         ↓
Return success response
         ↓
Update React state
         ↓
Reload classes list
         ↓
Show success message
```

---

### 3. Schedule Management Flow

```
User clicks "View Schedule" on class card
         ↓
Show 6×6 Grid Modal (Days × Time Slots)
         ↓
Initialize with empty cells or existing data
         ↓
User edits cells (assigns rooms)
         ↓
Update local React state
         ↓
User clicks "Save Schedule"
         ↓
Collect all schedule data from grid
         ↓
POST to /api/class/classes/:id/schedule/bulk
         ↓
Backend: Delete old schedule → Insert new entries
         ↓
Entries stored in class_room_time_map table
         ↓
Return success response
         ↓
Show success message
         ↓
Close modal
```

---

### 4. Room-IP Configuration Flow

```
User clicks "Config" in Navbar
         ↓
Fetch from /api/config/room-ip (with JWT token)
         ↓
Backend: Verify token → Query database
         ↓
Return mappings from room_ip_map table
         ↓
Display in table format
         ↓
User clicks "Add New Mapping"
         ↓
Show Modal Form
         ↓
User enters: room, ip
         ↓
Validate IP format (client-side)
         ↓
Submit to /api/config/room-ip (POST)
         ↓
Backend: Validate → Check duplicates → Insert
         ↓
Return success response
         ↓
Update React state
         ↓
Reload mappings list
         ↓
Show success message
```

---

## API Request/Response Cycle

### Example: Login Request

```
┌─ Client (Browser) ─────────────────────────────┐
│                                                 │
│ 1. User enters email & password                 │
│    {email: "test@example.com", password: "xxx"}│
│                                                 │
│ 2. POST /api/auth/login                        │
│    Headers: {Content-Type: application/json}   │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │ HTTP Request
                 ↓
┌─ Server (Backend) ────────────────────────────┐
│                                                │
│ 3. Receive request                            │
│    Parse JSON body                            │
│                                                │
│ 4. Find teacher by email                      │
│    Query: SELECT * FROM teacher WHERE email=? │
│                                                │
│ 5. Compare passwords using bcryptjs           │
│    bcryptjs.compare(input, stored_hash)       │
│                                                │
│ 6. Generate JWT token                         │
│    jwt.sign({id, name, email}, SECRET, opts)  │
│                                                │
│ 7. Send response                              │
│    {token: "xxx", teacher: {...}}             │
│                                                │
└────────────────┬────────────────────────────────┘
                 │ HTTP Response (JSON)
                 ↓
┌─ Client (Browser) ─────────────────────────────┐
│                                                 │
│ 8. Receive token & user data                   │
│                                                 │
│ 9. Store in LocalStorage                       │
│    - localStorage.setItem('authToken', token)  │
│    - localStorage.setItem('user', userJSON)    │
│                                                 │
│ 10. Update AuthContext state                   │
│     setUser(userData)                          │
│     setToken(token)                            │
│                                                 │
│ 11. Redirect to /dashboard                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Protected Route Access

```
User tries to access /class-info
         ↓
ProtectedRoute component checks
         ↓
         ├─ user from AuthContext exists? Yes → Render ClassInfo
         │
         └─ No → <Navigate to="/login" />
                  ↓
                  Redirect to login page
                  ↓
                  Show login form
                  ↓
                  After successful login → Redirect to /class-info
```

---

## File Dependencies

```
App.js
  ├─ BrowserRouter (Routes)
  │  └─ Routes
  │     ├─ /login → Login.js
  │     ├─ /register → Register.js
  │     └─ ProtectedRoute
  │        ├─ /dashboard → Dashboard.js
  │        ├─ /class-info → ClassInfo.js
  │        └─ /config → Config.js
  │
  ├─ AuthProvider (context/AuthContext.js)
  │  └─ useAuth hook
  │
  └─ All pages import api.js

Navbar.js
  ├─ Link (React Router)
  └─ useAuth hook

ClassInfo.js
  ├─ classAPI (from api.js)
  ├─ useEffect, useState
  └─ DAYS & TIME_SLOTS constants

Config.js
  ├─ configAPI (from api.js)
  ├─ useEffect, useState
  └─ validateIpAddress function

api.js
  ├─ authAPI (auth endpoints)
  ├─ classAPI (class endpoints)
  ├─ configAPI (config endpoints)
  └─ apiCall helper function

AuthContext.js
  ├─ authAPI (from api.js)
  └─ createContext & useContext
```

---

## Database Schema Relationships

```
teacher
  ├─ (1) → (many) teacher_student_attendance
  ├─ (1) → (many) subject_time_map
  └─ Can have many classes via subject_time_map

class_student_map
  ├─ (1) → (many) class_room_time_map
  ├─ (1) → (many) teacher_student_attendance
  └─ (1) → (many) subject_time_map

class_room_time_map
  ├─ Linked to class via class_student_map
  └─ (1) → (many) global_student_attendance

room_ip_map
  └─ (1) → (many) global_student_attendance

global_student_attendance
  └─ Tracks attendance by room & time

teacher_student_attendance
  └─ Tracks attendance by teacher, class & time

subject_time_map
  └─ Maps subjects to teachers, classes & times
```

---

## Security Flow

```
API Request arrives
         ↓
Express receives request
         ↓
Check Authorization Header for "Bearer <token>"
         ↓
         ├─ No token? → 401 Unauthorized
         │
         └─ Token exists? 
            ↓
            JWT verify with SECRET
            ↓
            ├─ Invalid/Expired? → 403 Forbidden
            │
            └─ Valid? 
               ↓
               Decode token → Get teacher.id
               ↓
               Attach teacher object to req
               ↓
               Continue to route handler
               ↓
               Execute database query
               ↓
               Parameterized SQL (prevents injection)
               ↓
               Return response
```

---

**Diagram Version**: 1.0
**Last Updated**: January 2026
