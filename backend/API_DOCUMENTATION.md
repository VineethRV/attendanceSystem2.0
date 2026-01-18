# Attendance Management System - Backend Documentation

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm

### Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE attendance_system;
USE attendance_system;
```

2. Create the required tables:
```sql
-- Teacher table
CREATE TABLE teacher (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  designation VARCHAR(50),
  email VARCHAR(100) NOT NULL UNIQUE
);

-- Class-Student Mapping table
CREATE TABLE class_student_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class CHAR(5),
  USNStart CHAR(10),
  USNEnd CHAR(10)
);

-- Class-Room-Time Mapping table
CREATE TABLE class_room_time_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  DTime VARCHAR(10),
  room VARCHAR(15)
);

-- Room-IP Mapping table
CREATE TABLE room_ip_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room VARCHAR(15),
  ip VARCHAR(16)
);

-- Global Student Attendance table
CREATE TABLE global_student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room VARCHAR(15) NOT NULL,
  DTime VARCHAR(10) NOT NULL,
  attendance CHAR(60) NOT NULL
);

-- Teacher-Student Attendance table
CREATE TABLE teacher_student_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class CHAR(5) NOT NULL,
  DTime VARCHAR(10) NOT NULL,
  attendance CHAR(60) NOT NULL
);

-- Subject-Time Mapping table
CREATE TABLE subject_time_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class CHAR(5),
  teacher_id INT,
  subject VARCHAR(100),
  DTime VARCHAR(10)
);
```

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_system
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=development
```

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

---

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Health Check
- **GET** `/health`
- Returns: `{ message: "Server is running" }`

---

## Authentication Endpoints

### Register Teacher
- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "designation": "Professor"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Teacher registered successfully",
    "token": "jwt_token_here",
    "teacher": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Professor"
    }
  }
  ```

### Login Teacher
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token_here",
    "teacher": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Professor"
    }
  }
  ```

### Get Current Teacher
- **GET** `/auth/me`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "teacher": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Professor"
    }
  }
  ```

---

## Class Info Endpoints

### Get All Classes
- **GET** `/class/classes`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "classes": [
      {
        "id": 1,
        "class": "CS5A",
        "USNStart": "1RV21CS001",
        "USNEnd": "1RV21CS060"
      }
    ]
  }
  ```

### Add New Class
- **POST** `/class/classes`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "className": "CS5A",
    "usnStart": "1RV21CS001",
    "usnEnd": "1RV21CS060"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Class added successfully",
    "classId": 1,
    "class": {
      "id": 1,
      "class": "CS5A",
      "USNStart": "1RV21CS001",
      "USNEnd": "1RV21CS060",
      "studentCount": 60
    }
  }
  ```

### Update Class
- **PUT** `/class/classes/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "className": "CS5A",
    "usnStart": "1RV21CS001",
    "usnEnd": "1RV21CS060"
  }
  ```

### Delete Class
- **DELETE** `/class/classes/:id`
- **Headers**: `Authorization: Bearer {token}`

### Get Class Schedule
- **GET** `/class/classes/:classId/schedule`
- **Headers**: `Authorization: Bearer {token}`

### Bulk Update Schedule (6x6 Table)
- **POST** `/class/classes/:classId/schedule/bulk`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "scheduleData": {
      "Monday-Slot 1": "Room101",
      "Monday-Slot 2": "Room102",
      "Tuesday-Slot 1": "Room101"
    }
  }
  ```

---

## Configuration Endpoints

### Get All Room-IP Mappings
- **GET** `/config/room-ip`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "mappings": [
      {
        "id": 1,
        "room": "Room101",
        "ip": "192.168.1.101"
      }
    ]
  }
  ```

### Add Room-IP Mapping
- **POST** `/config/room-ip`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "room": "Room101",
    "ip": "192.168.1.101"
  }
  ```

### Update Room-IP Mapping
- **PUT** `/config/room-ip/:id`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "room": "Room101",
    "ip": "192.168.1.101"
  }
  ```

### Delete Room-IP Mapping
- **DELETE** `/config/room-ip/:id`
- **Headers**: `Authorization: Bearer {token}`

---

## Error Handling

All endpoints return error responses in this format:
```json
{
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Server Error

---

## Authentication

Most endpoints require JWT token authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are valid for 7 days by default (configurable via `JWT_EXPIRY` in `.env`).

---

## Development Notes

- Passwords are hashed using bcryptjs with 10 salt rounds
- JWT tokens are used for stateless authentication
- MySQL connection pooling is used for better performance
- CORS is enabled for `http://localhost:3000` (frontend)
- All database queries use parameterized statements to prevent SQL injection
