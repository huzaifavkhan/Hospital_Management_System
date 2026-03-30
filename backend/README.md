# Hospital Management System — Backend API

**Stack:** Express.js · PostgreSQL (Docker) · Prisma ORM
**Base URL:** `http://localhost:5001/api`

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Setup & Running](#setup--running)
4. [Environment Variables](#environment-variables)
5. [Default Seed Accounts](#default-seed-accounts)
6. [Postman Setup](#postman-setup)
7. [API Routes — Step-by-Step Postman Guide](#api-routes--step-by-step-postman-guide)
   - [Health Check](#health-check)
   - [Authentication](#authentication)
   - [Workflow 1 — Patient Management](#workflow-1--patient-management)
   - [Workflow 2 — Doctor Operations](#workflow-2--doctor-operations)
   - [Workflow 3 — Administrative Control](#workflow-3--administrative-control)
8. [Response Format](#response-format)
9. [Database Schema](#database-schema)
10. [Stopping the Database](#stopping-the-database)

---

## Prerequisites

Install the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or higher | https://nodejs.org |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Postman | Latest | https://www.postman.com/downloads |

---

## Project Structure

```
Hospital_Management_System/
├── docker-compose.yml          ← Starts the PostgreSQL database
└── backend/
    ├── .env.example            ← Copy this to .env
    ├── package.json
    ├── server.js               ← Entry point
    ├── prisma/
    │   ├── schema.prisma       ← Database models
    │   ├── seed.js             ← Sample data
    │   └── migrations/
    └── src/
        ├── app.js
        ├── routes/             ← URL handlers
        │   ├── index.js
        │   ├── auth.js
        │   ├── patients.js
        │   ├── doctors.js
        │   └── admin.js
        ├── services/           ← Business logic
        │   ├── authService.js
        │   ├── patientService.js
        │   ├── doctorService.js
        │   └── adminService.js
        └── middleware/
            ├── auth.js         ← JWT verification
            └── auditLog.js     ← Audit logging
```

---

## Setup & Running

Follow these steps **in order** every time you set up on a new machine.

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd Hospital_Management_System
```

### Step 2 — Start the PostgreSQL database (Docker)

From the **project root** (the folder containing `docker-compose.yml`):

```bash
docker-compose up -d
```

This starts a PostgreSQL 15 container with:

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5433` |
| Database | `hospital_db` |
| Username | `hospital_user` |
| Password | `hospital_pass` |

Verify it is running:

```bash
docker ps
```

You should see a container named `hospital_db` with status `Up`.

### Step 3 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 4 — Configure environment variables

```bash
cp .env.example .env
```

The defaults in `.env.example` already match the Docker Compose configuration. No changes are needed for local development.

### Step 5 — Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all the tables in the database.

### Step 6 — Seed the database (recommended)

```bash
npm run prisma:seed
```

This creates default admin/receptionist accounts, 5 departments, and default hospital settings.

### Step 7 — Start the backend server

```bash
npm run dev       # Development mode (auto-restarts on file changes)
```

or

```bash
npm start         # Production mode
```

The server starts on **http://localhost:5001**.

You should see:

```
Server running on port 5001
Database connected successfully
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Port the server listens on |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://hospital_user:hospital_pass@localhost:5433/hospital_db` | PostgreSQL connection string |
| `JWT_SECRET` | `your_super_secret_jwt_key_change_in_production` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | `24h` | How long JWT tokens stay valid |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |

---

## Default Seed Accounts

After running the seed command, these accounts are available:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `receptionist` | `recept123` | RECEPTIONIST |

**Role permissions:**
- **ADMIN** — Full access to all routes including admin panel
- **RECEPTIONIST** — Can manage patients and doctors, cannot access admin panel
- **STAFF** — Read-only access to patients and doctors

---

## Postman Setup

### Create a Collection

1. Open Postman
2. Click **Collections** in the left sidebar
3. Click **+** to create a new collection
4. Name it `Hospital Management System`

### Create an Environment

This stores your JWT token so you don't have to paste it into every request.

1. Click **Environments** in the left sidebar
2. Click **+** to create a new environment
3. Name it `HMS Local`
4. Add the following variables:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:5001/api` | `http://localhost:5001/api` |
| `token` | (leave empty) | (leave empty) |

5. Click **Save**
6. Select `HMS Local` from the environment dropdown (top-right of Postman)

### Auto-save token after login

On your **Login** request (created below):

1. Go to the **Tests** tab
2. Paste this script:

```javascript
const res = pm.response.json();
if (res.success && res.data.token) {
    pm.environment.set("token", res.data.token);
    console.log("Token saved!");
}
```

Now every time you log in, the token is automatically saved to the environment.

### Use the token in requests

For all protected routes, go to the **Authorization** tab of the request:
- Type: **Bearer Token**
- Token: `{{token}}`

---

## API Routes — Step-by-Step Postman Guide

---

### Health Check

Verify the server is running.

**GET** `http://localhost:5001/health`

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/health` |
| Auth | None |

Expected response:
```json
{
  "status": "ok",
  "message": "Hospital Management System API is running"
}
```

---

### Authentication

#### Register a new user

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/auth/register` |
| Auth | None |
| Body | raw → JSON |

Request body:
```json
{
  "username": "nurse01",
  "password": "securepass123",
  "fullName": "Jane Smith",
  "role": "STAFF"
}
```

> **Note:** Valid roles are `ADMIN`, `RECEPTIONIST`, `STAFF`.

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 3,
    "username": "nurse01",
    "fullName": "Jane Smith",
    "role": "STAFF"
  }
}
```

---

#### Login

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/auth/login` |
| Auth | None |
| Body | raw → JSON |

Request body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Administrator",
      "role": "ADMIN"
    }
  }
}
```

> If you added the Tests script from the Postman Setup section, the token is saved automatically. Otherwise, copy the token value and set it manually in the environment.

---

### Workflow 1 — Patient Management

> All patient routes require the `Authorization: Bearer {{token}}` header.
> Set this under the **Authorization** tab → Type: Bearer Token → Token: `{{token}}`

---

#### 1.1 — Register a new patient

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/patients` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body:
```json
{
  "name": "John Doe",
  "age": 35,
  "gender": "Male",
  "contactNumber": "+1-555-0100",
  "address": "123 Main St",
  "medicalHistory": "Hypertension, Type 2 Diabetes"
}
```

> `medicalHistory` is optional. All other fields are required.

Expected response:
```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "id": 1,
    "patientId": "PAT-00001",
    "name": "John Doe",
    "age": 35,
    "gender": "Male",
    "contactNumber": "+1-555-0100",
    "address": "123 Main St",
    "medicalHistory": "Hypertension, Type 2 Diabetes"
  }
}
```
---

#### 1.2 — List all patients

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/patients` |
| Auth | Bearer Token → `{{token}}` |

With optional query parameters:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `search` | `John` | Search by name, patientId, or contact number |
| `page` | `1` | Page number (default: 1) |
| `limit` | `10` | Results per page (default: 10) |

Example with search:
`http://localhost:5001/api/patients?search=John&page=1&limit=10`

Expected response:
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": 1,
        "patientId": "PAT-00001",
        "name": "John Doe",
        "age": 35,
        "gender": "Male",
        "contactNumber": "+1-555-0100",
        "address": "123 Main St",
        "medicalHistory": "Hypertension",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

#### 1.3 — Get a single patient by ID

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/patients/1` |
| Auth | Bearer Token → `{{token}}` |

Replace `1` with the actual patient ID (the numeric `id`, not `PAT-00001`).

Expected response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "patientId": "PAT-00001",
    "name": "John Doe",
    "age": 35,
    "gender": "Male",
    "contactNumber": "+1-555-0100",
    "address": "123 Main St",
    "medicalHistory": "Hypertension",
    "doctors": []
  }
}
```

---

#### 1.4 — Update a patient record

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `http://localhost:5001/api/patients/1` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body (include only the fields you want to update):
```json
{
  "age": 36,
  "address": "456 Oak Avenue",
  "medicalHistory": "Hypertension, Type 2 Diabetes, Asthma"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Patient updated successfully",
  "data": {
    "id": 1,
    "patientId": "PAT-00001",
    "name": "John Doe",
    "age": 36,
    "address": "456 Oak Avenue",
    "medicalHistory": "Hypertension, Type 2 Diabetes, Asthma"
  }
}
```

---

#### 1.5 — Delete a patient

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `http://localhost:5001/api/patients/1` |
| Auth | Bearer Token → `{{token}}` |
| Body | None |

Expected response:
```json
{
  "success": true,
  "message": "Patient deleted successfully"
}
```

---

### Workflow 2 — Doctor Operations

> All doctor routes require the `Authorization: Bearer {{token}}` header.

---

#### 2.1 — Register a new doctor

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/doctors` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body:
```json
{
  "name": "Dr. Sarah Johnson",
  "specialization": "Cardiology",
  "contactNumber": "+1-555-0200",
  "departmentId": 1,
  "availabilitySchedule": {
    "monday": { "start": "09:00", "end": "17:00" },
    "tuesday": { "start": "09:00", "end": "17:00" },
    "wednesday": { "start": "10:00", "end": "15:00" },
    "friday": { "start": "09:00", "end": "13:00" }
  }
}
```

> `availabilitySchedule` is optional. `departmentId` must match an existing department (run List Departments to find IDs).

Expected response:
```json
{
  "success": true,
  "message": "Doctor registered successfully",
  "data": {
    "id": 1,
    "doctorId": "DOC-00001",
    "name": "Dr. Sarah Johnson",
    "specialization": "Cardiology",
    "contactNumber": "+1-555-0200",
    "departmentId": 1
  }
}
```

---

#### 2.2 — List all doctors

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/doctors` |
| Auth | Bearer Token → `{{token}}` |

With optional query parameters:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `search` | `Sarah` | Search by name or doctorId |
| `departmentId` | `1` | Filter by department |
| `specialization` | `Cardiology` | Filter by specialization |
| `page` | `1` | Page number |
| `limit` | `10` | Results per page |

Example with filters:
`http://localhost:5001/api/doctors?specialization=Cardiology&page=1&limit=10`

Expected response:
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": 1,
        "doctorId": "DOC-00001",
        "name": "Dr. Sarah Johnson",
        "specialization": "Cardiology",
        "contactNumber": "+1-555-0200",
        "availabilitySchedule": {
          "monday": { "start": "09:00", "end": "17:00" }
        },
        "department": { "id": 1, "name": "Cardiology" }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

#### 2.3 — Get a single doctor by ID

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/doctors/1` |
| Auth | Bearer Token → `{{token}}` |

Expected response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "doctorId": "DOC-00001",
    "name": "Dr. Sarah Johnson",
    "specialization": "Cardiology",
    "contactNumber": "+1-555-0200",
    "availabilitySchedule": {
      "monday": { "start": "09:00", "end": "17:00" },
      "wednesday": { "start": "10:00", "end": "15:00" }
    },
    "department": { "id": 1, "name": "Cardiology" },
    "patients": []
  }
}
```

---

#### 2.4 — Update a doctor record

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `http://localhost:5001/api/doctors/1` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body (include only the fields you want to update):
```json
{
  "specialization": "Interventional Cardiology",
  "availabilitySchedule": {
    "monday": { "start": "08:00", "end": "16:00" },
    "thursday": { "start": "09:00", "end": "17:00" }
  }
}
```

Expected response:
```json
{
  "success": true,
  "message": "Doctor updated successfully",
  "data": {
    "id": 1,
    "doctorId": "DOC-00001",
    "name": "Dr. Sarah Johnson",
    "specialization": "Interventional Cardiology"
  }
}
```

---

#### 2.5 — Delete a doctor

> Requires ADMIN role only.

| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `http://localhost:5001/api/doctors/1` |
| Auth | Bearer Token → `{{token}}` (must be ADMIN) |
| Body | None |

Expected response:
```json
{
  "success": true,
  "message": "Doctor deleted successfully"
}
```
---

#### 2.6 — Assign a patient to a doctor

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/doctors/1/assign-patient` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body:
```json
{
  "patientId": 1
}
```

Expected response:
```json
{
  "success": true,
  "message": "Patient assigned to doctor successfully",
  "data": {
    "doctorId": 1,
    "patientId": 1,
    "assignedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### 2.7 — Get patients assigned to a doctor

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/doctors/1/patients` |
| Auth | Bearer Token → `{{token}}` |

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patientId": "PAT-00001",
      "name": "John Doe",
      "age": 35,
      "assignedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 2.8 — Unassign a patient from a doctor

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `http://localhost:5001/api/doctors/1/unassign-patient/1` |
| Auth | Bearer Token → `{{token}}` |
| Body | None |

> Replace the first `1` with the doctor's ID and the second `1` with the patient's ID.

Expected response:
```json
{
  "success": true,
  "message": "Patient unassigned from doctor successfully"
}
```

---

### Workflow 3 — Administrative Control

> All admin routes require **ADMIN** role. Log in with the `admin` account before using these.

---

#### 3.1 — Get hospital statistics

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/stats` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

Expected response:
```json
{
  "success": true,
  "data": {
    "totalPatients": 10,
    "totalDoctors": 5,
    "totalDepartments": 5,
    "totalUsers": 3,
    "departmentBreakdown": [
      { "name": "Cardiology", "doctorCount": 2 },
      { "name": "Neurology", "doctorCount": 1 }
    ]
  }
}
```

---

#### Departments

---

#### 3.2 — List all departments

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/departments` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

Expected response:
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Cardiology", "description": "Heart and cardiovascular care" },
    { "id": 2, "name": "Neurology", "description": "Brain and nervous system" },
    { "id": 3, "name": "Orthopedics", "description": "Bone and joint care" },
    { "id": 4, "name": "Pediatrics", "description": "Children healthcare" },
    { "id": 5, "name": "General Medicine", "description": "General medical care" }
  ]
}
```

---

#### 3.3 — Get a single department

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/departments/1` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

Expected response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Cardiology",
    "description": "Heart and cardiovascular care",
    "doctors": [
      { "id": 1, "doctorId": "DOC-00001", "name": "Dr. Sarah Johnson" }
    ]
  }
}
```

---

#### 3.4 — Create a department

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/admin/departments` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |
| Body | raw → JSON |

Request body:
```json
{
  "name": "Oncology",
  "description": "Cancer diagnosis and treatment"
}
```

> `description` is optional.

Expected response:
```json
{
  "success": true,
  "message": "Department created successfully",
  "data": {
    "id": 6,
    "name": "Oncology",
    "description": "Cancer diagnosis and treatment"
  }
}
```

---

#### 3.5 — Update a department

| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `http://localhost:5001/api/admin/departments/6` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |
| Body | raw → JSON |

Request body:
```json
{
  "name": "Oncology & Hematology",
  "description": "Cancer and blood disorder treatment"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Department updated successfully",
  "data": {
    "id": 6,
    "name": "Oncology & Hematology",
    "description": "Cancer and blood disorder treatment"
  }
}
```

---

#### 3.6 — Delete a department

| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `http://localhost:5001/api/admin/departments/6` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |
| Body | None |

Expected response:
```json
{
  "success": true,
  "message": "Department deleted successfully"
}
```

---

#### User Management

---

#### 3.7 — List all users

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/users` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

With optional query parameters:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `search` | `jane` | Search by username or full name |
| `role` | `RECEPTIONIST` | Filter by role (`ADMIN`, `RECEPTIONIST`, `STAFF`) |
| `page` | `1` | Page number |
| `limit` | `10` | Results per page |

Example: `http://localhost:5001/api/admin/users?role=RECEPTIONIST&page=1&limit=10`

Expected response:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 2,
        "username": "receptionist",
        "fullName": "Front Desk",
        "role": "RECEPTIONIST",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

#### 3.8 — Get a single user

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/users/2` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

Expected response:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "receptionist",
    "fullName": "Front Desk",
    "role": "RECEPTIONIST",
    "isActive": true
  }
}
```

---

#### 3.9 — Create a user account

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/admin/users` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |
| Body | raw → JSON |

Request body:
```json
{
  "username": "nurse01",
  "password": "securepass123",
  "fullName": "Mary Johnson",
  "role": "STAFF"
}
```

Expected response:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 3,
    "username": "nurse01",
    "fullName": "Mary Johnson",
    "role": "STAFF",
    "isActive": true
  }
}
```

---

#### 3.10 — Update a user account

| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `http://localhost:5001/api/admin/users/3` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |
| Body | raw → JSON |

Request body (include only the fields you want to update):
```json
{
  "fullName": "Mary Johnson RN",
  "role": "RECEPTIONIST",
  "isActive": true
}
```

To reset a user's password, include `"password"`:
```json
{
  "password": "newpassword456"
}
```

Expected response:
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 3,
    "username": "nurse01",
    "fullName": "Mary Johnson RN",
    "role": "RECEPTIONIST",
    "isActive": true
  }
}
```

---

#### 3.11 — Deactivate a user account

> This is a soft delete — the account is deactivated, not permanently removed.

| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `http://localhost:5001/api/admin/users/3` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |
| Body | None |

Expected response:
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

#### Reports

---

#### 3.12 — Generate a report

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/reports` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

Query parameters:

| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `type` | Yes | `patients`, `doctors`, `summary` | Type of report |
| `from` | No | `2024-01-01` | Start date (ISO format) |
| `to` | No | `2024-12-31` | End date (ISO format) |

Examples:

- Patient report: `http://localhost:5001/api/admin/reports?type=patients&from=2024-01-01&to=2024-12-31`
- Doctor report: `http://localhost:5001/api/admin/reports?type=doctors`
- Summary report: `http://localhost:5001/api/admin/reports?type=summary`

Expected response (summary):
```json
{
  "success": true,
  "data": {
    "type": "summary",
    "generatedAt": "2024-06-01T12:00:00.000Z",
    "totalPatients": 10,
    "totalDoctors": 5,
    "totalDepartments": 5
  }
}
```

---

#### Audit Logs

---

#### 3.13 — View audit logs

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/audit-logs` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

Query parameters:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `entity` | `Patient` | Filter by entity type (`Patient`, `Doctor`, `Department`, `User`) |
| `action` | `CREATE` | Filter by action (`CREATE`, `UPDATE`, `DELETE`, `ASSIGN_PATIENT`) |
| `page` | `1` | Page number |
| `limit` | `20` | Results per page |

Example: `http://localhost:5001/api/admin/audit-logs?entity=Patient&action=CREATE&page=1&limit=20`

Expected response:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "action": "CREATE",
        "entity": "Patient",
        "entityId": "1",
        "user": { "username": "receptionist", "fullName": "Front Desk" },
        "details": { "method": "POST", "path": "/api/patients" },
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

#### Hospital Settings

---

#### 3.14 — Get hospital settings

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/admin/settings` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |

Expected response:
```json
{
  "success": true,
  "data": {
    "hospital_name": "City General Hospital",
    "hospital_contact": "+1-555-0000",
    "hospital_address": "123 Medical Drive",
    "hospital_email": "info@hospital.com"
  }
}
```

---

#### 3.15 — Update hospital settings

| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `http://localhost:5001/api/admin/settings` |
| Auth | Bearer Token → `{{token}}` (ADMIN only) |
| Body | raw → JSON |

Request body (include only the settings you want to update):
```json
{
  "hospital_name": "City General Hospital",
  "hospital_contact": "+1-555-9999",
  "hospital_address": "456 Healthcare Blvd, City, State 12345",
  "hospital_email": "contact@citygeneral.com"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "hospital_name": "City General Hospital",
    "hospital_contact": "+1-555-9999",
    "hospital_address": "456 Healthcare Blvd, City, State 12345",
    "hospital_email": "contact@citygeneral.com"
  }
}
```

---

## Response Format

Every API response follows this consistent structure:

**Success:**
```json
{
  "success": true,
  "message": "Optional status message",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

**Common HTTP status codes:**

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — new resource created |
| `400` | Bad Request — missing or invalid fields |
| `401` | Unauthorized — no token or token expired |
| `403` | Forbidden — valid token but insufficient role |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate entry (e.g., username already taken) |
| `500` | Internal Server Error — something went wrong on the server |

---

## Database Schema

| Model | Key Fields |
|-------|-----------|
| `User` | `id`, `username`, `password` (hashed), `fullName`, `role` (ADMIN/RECEPTIONIST/STAFF), `isActive` |
| `Patient` | `id`, `patientId` (PAT-XXXXX), `name`, `age`, `gender`, `contactNumber`, `address`, `medicalHistory` |
| `Doctor` | `id`, `doctorId` (DOC-XXXXX), `name`, `specialization`, `contactNumber`, `availabilitySchedule` (JSON), `departmentId` |
| `Department` | `id`, `name`, `description` |
| `PatientDoctor` | `patientId`, `doctorId`, `assignedAt` (join table) |
| `AuditLog` | `id`, `userId`, `action`, `entity`, `entityId`, `details`, `createdAt` |
| `HospitalSettings` | `id`, `key`, `value` |

---

## Stopping the Database

```bash
docker-compose down          # Stop the container (data is preserved)
docker-compose down -v       # Stop and permanently delete all data
```
