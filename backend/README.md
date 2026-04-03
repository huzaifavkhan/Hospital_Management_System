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
6. [API Routes — Step-by-Step Postman Guide](#api-routes--step-by-step-postman-guide)
   - [Health Check](#health-check)
   - [Authentication](#authentication)
   - [Workflow 1 — Patient Management](#workflow-1--patient-management)
   - [Workflow 2 — Doctor Operations](#workflow-2--doctor-operations)
   - [Workflow 3 — Administrative Control](#workflow-3--administrative-control)
   - [Workflow 4 — Appointment & Scheduling](#workflow-4--appointment--scheduling)
7. [Response Format](#response-format)
8. [Database Schema](#database-schema)
9. [Stopping the Database](#stopping-the-database)

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
        ├── db/
        │   └── prisma.js       ← Shared Prisma client
        ├── routes/             ← URL handlers
        │   ├── index.js
        │   ├── auth.js
        │   ├── patients.js
        │   ├── visits.js       ← Visit history (nested under patients)
        │   ├── doctors.js
        │   ├── appointments.js
        │   └── admin.js
        ├── services/           ← Business logic
        │   ├── authService.js
        │   ├── patientService.js
        │   ├── visitService.js
        │   ├── doctorService.js
        │   ├── appointmentService.js
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
npm run prisma:migrate
```

> **Note:** This uses the local Prisma binary (`./node_modules/.bin/prisma migrate dev`). Do **not** use `npx prisma` as it may install a newer incompatible version.

This creates all the tables in the database.

### Step 6 — Seed the database (recommended)

```bash
npm run prisma:seed
```

This creates default admin/receptionist accounts (credentials come from your `.env` — see `SEED_ADMIN_PASSWORD` and `SEED_RECEPTIONIST_PASSWORD`), 5 departments, and default hospital settings.

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
| `SEED_ADMIN_USERNAME` | `admin` | Username for the seeded admin account |
| `SEED_ADMIN_PASSWORD` | *(required)* | Password for the seeded admin account |
| `SEED_RECEPTIONIST_USERNAME` | `receptionist` | Username for the seeded receptionist account |
| `SEED_RECEPTIONIST_PASSWORD` | *(required)* | Password for the seeded receptionist account |

---

## Default Seed Accounts

After running the seed command, these accounts are available (usernames/passwords are set via env variables — see `SEED_ADMIN_*` / `SEED_RECEPTIONIST_*` in `.env.example`):

| Username | Password | Role |
|----------|----------|------|
| `$SEED_ADMIN_USERNAME` | `$SEED_ADMIN_PASSWORD` | ADMIN |
| `$SEED_RECEPTIONIST_USERNAME` | `$SEED_RECEPTIONIST_PASSWORD` | RECEPTIONIST |

**Role permissions:**
- **ADMIN** — Full access to all routes including admin panel
- **RECEPTIONIST** — Can manage patients, doctors, visits, and appointments; cannot access admin panel
- **STAFF** — Read-only access to patients and doctors

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
  "fullName": "Jane Smith"
}
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 3,
    "username": "nurse01",
    "fullName": "Jane Smith",
    "role": "RECEPTIONIST"
  }
}
```

---

#### Login (generic)

Works for any role. The response includes the user's role so the frontend can redirect accordingly.

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
  "password": "<your SEED_ADMIN_PASSWORD>"
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

> Copy the `token` value and use it as a Bearer Token in all subsequent requests.

---

#### Login — Admin only

Rejects login if the account is not an ADMIN. Use this endpoint for a dedicated admin login page.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/auth/login/admin` |
| Auth | None |
| Body | raw → JSON |

Request body:
```json
{
  "username": "admin",
  "password": "<your SEED_ADMIN_PASSWORD>"
}
```

Returns `403 Forbidden` if the account role is not `ADMIN`.

---

#### Login — Receptionist only

Rejects login if the account is not a RECEPTIONIST.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/auth/login/receptionist` |
| Auth | None |
| Body | raw → JSON |

Request body:
```json
{
  "username": "receptionist",
  "password": "<your SEED_RECEPTIONIST_PASSWORD>"
}
```

Returns `403 Forbidden` if the account role is not `RECEPTIONIST`.

---

#### Change password (authenticated)

Allows a logged-in user to change their own password.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/auth/change-password` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

#### Forgot password

Generates a password reset token. In a production system this would be emailed; here the token is returned directly for testing purposes.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/auth/forgot-password` |
| Auth | None |
| Body | raw → JSON |

Request body:
```json
{
  "username": "receptionist"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Reset token generated",
  "resetToken": "a3f8c2d1e4b9..."
}
```

> Copy the `resetToken` value — you will need it in the next step. The token expires after **1 hour**.

---

#### Reset password

Uses the token from the previous step to set a new password.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/auth/reset-password` |
| Auth | None |
| Body | raw → JSON |

Request body:
```json
{
  "resetToken": "a3f8c2d1e4b9...",
  "newPassword": "freshpassword789"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

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

#### Visit History

Visit history is nested under a patient. Each visit records the attending doctor, date, diagnosis, and a summary.

---

#### 1.6 — List all visits for a patient

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/patients/1/visits` |
| Auth | Bearer Token → `{{token}}` |

Replace `1` with the patient's numeric ID. Results are ordered newest-first.

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "visitDate": "2024-03-10T09:00:00.000Z",
      "diagnosis": "Hypertensive crisis",
      "summary": "BP was 180/110. Administered medication and advised rest.",
      "doctor": {
        "id": 1,
        "doctorId": "DOC-00001",
        "name": "Dr. Sarah Johnson",
        "specialization": "Cardiology"
      }
    }
  ]
}
```

---

#### 1.7 — Log a new visit

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/patients/1/visits` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body:
```json
{
  "doctorId": 1,
  "visitDate": "2024-03-10T09:00:00.000Z",
  "diagnosis": "Hypertensive crisis",
  "summary": "BP was 180/110. Administered medication and advised rest."
}
```

> `doctorId` and `visitDate` are required. `diagnosis` and `summary` are optional.

Expected response:
```json
{
  "success": true,
  "message": "Visit recorded successfully",
  "data": {
    "id": 1,
    "visitDate": "2024-03-10T09:00:00.000Z",
    "diagnosis": "Hypertensive crisis",
    "summary": "BP was 180/110. Administered medication and advised rest.",
    "doctor": {
      "id": 1,
      "doctorId": "DOC-00001",
      "name": "Dr. Sarah Johnson",
      "specialization": "Cardiology"
    },
    "patient": {
      "id": 1,
      "patientId": "PAT-00001",
      "name": "John Doe"
    }
  }
}
```

---

#### 1.8 — Update a visit record

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `http://localhost:5001/api/patients/1/visits/1` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body (include only the fields you want to update):
```json
{
  "diagnosis": "Stage 2 Hypertension",
  "summary": "Updated summary after lab results reviewed."
}
```

Expected response:
```json
{
  "success": true,
  "message": "Visit updated successfully",
  "data": {
    "id": 1,
    "visitDate": "2024-03-10T09:00:00.000Z",
    "diagnosis": "Stage 2 Hypertension",
    "summary": "Updated summary after lab results reviewed.",
    "doctor": {
      "id": 1,
      "name": "Dr. Sarah Johnson"
    }
  }
}
```

---

#### 1.9 — Delete a visit record

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | DELETE |
| URL | `http://localhost:5001/api/patients/1/visits/1` |
| Auth | Bearer Token → `{{token}}` |
| Body | None |

Expected response:
```json
{
  "success": true,
  "message": "Visit deleted successfully"
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
    "todaysAppointments": 4,
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
    "data": {
      "patients": 10,
      "doctors": 5
    }
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
| `entity` | `Patient` | Filter by entity type (`Patient`, `Doctor`, `Visit`, `Appointment`, `Department`, `User`) |
| `action` | `CREATE` | Filter by action (`CREATE`, `UPDATE`, `DELETE`, `CANCEL`, `ASSIGN_PATIENT`) |
| `page` | `1` | Page number |
| `limit` | `20` | Results per page |

Example: `http://localhost:5001/api/admin/audit-logs?entity=Appointment&action=CREATE&page=1&limit=20`

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

### Workflow 4 — Appointment & Scheduling

> All appointment routes require authentication. Creating, updating, and cancelling appointments requires ADMIN or RECEPTIONIST role.

---

#### 4.1 — Book an appointment

> Requires ADMIN or RECEPTIONIST role.
> The API **prevents double-booking** — a doctor cannot have two appointments within 30 minutes of each other.

| Field | Value |
|-------|-------|
| Method | POST |
| URL | `http://localhost:5001/api/appointments` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body:
```json
{
  "patientId": 1,
  "doctorId": 1,
  "dateTime": "2024-06-15T10:00:00.000Z",
  "notes": "Follow-up for blood pressure management"
}
```

> `patientId`, `doctorId`, and `dateTime` are required. `notes` is optional.

Expected response:
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": 1,
    "appointmentId": "APT-3F8C2D1E4B",
    "dateTime": "2024-06-15T10:00:00.000Z",
    "status": "SCHEDULED",
    "notes": "Follow-up for blood pressure management",
    "patient": {
      "id": 1,
      "patientId": "PAT-00001",
      "name": "John Doe",
      "contactNumber": "+1-555-0100"
    },
    "doctor": {
      "id": 1,
      "doctorId": "DOC-00001",
      "name": "Dr. Sarah Johnson",
      "specialization": "Cardiology"
    }
  }
}
```

> If the doctor is already booked within 30 minutes of the requested time, a `409 Conflict` response is returned.

---

#### 4.2 — List all appointments

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/appointments` |
| Auth | Bearer Token → `{{token}}` |

With optional query parameters:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `patientId` | `1` | Filter by patient |
| `doctorId` | `1` | Filter by doctor |
| `status` | `SCHEDULED` | Filter by status (`SCHEDULED`, `CANCELLED`, `COMPLETED`, `RESCHEDULED`) |
| `from` | `2024-06-01` | Start date |
| `to` | `2024-06-30` | End date |
| `page` | `1` | Page number |
| `limit` | `10` | Results per page |

Examples:
- Upcoming for a patient: `http://localhost:5001/api/appointments?patientId=1&status=SCHEDULED`
- Today's for a doctor: `http://localhost:5001/api/appointments?doctorId=1&from=2024-06-15&to=2024-06-15`

Expected response:
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 1,
        "appointmentId": "APT-3F8C2D1E4B",
        "dateTime": "2024-06-15T10:00:00.000Z",
        "status": "SCHEDULED",
        "notes": "Follow-up for blood pressure management",
        "patient": { "id": 1, "patientId": "PAT-00001", "name": "John Doe" },
        "doctor": { "id": 1, "doctorId": "DOC-00001", "name": "Dr. Sarah Johnson" }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

#### 4.3 — Get a single appointment

| Field | Value |
|-------|-------|
| Method | GET |
| URL | `http://localhost:5001/api/appointments/1` |
| Auth | Bearer Token → `{{token}}` |

Replace `1` with the appointment's numeric ID.

---

#### 4.4 — Reschedule an appointment

> Requires ADMIN or RECEPTIONIST role.
> Changing the `dateTime` automatically sets the status to `RESCHEDULED` unless you also pass a `status`.
> Double-booking is still checked on reschedule.

| Field | Value |
|-------|-------|
| Method | PUT |
| URL | `http://localhost:5001/api/appointments/1` |
| Auth | Bearer Token → `{{token}}` |
| Body | raw → JSON |

Request body:
```json
{
  "dateTime": "2024-06-20T14:00:00.000Z",
  "notes": "Rescheduled at patient request"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "data": {
    "id": 1,
    "appointmentId": "APT-3F8C2D1E4B",
    "dateTime": "2024-06-20T14:00:00.000Z",
    "status": "RESCHEDULED",
    "notes": "Rescheduled at patient request",
    "patient": { "id": 1, "name": "John Doe" },
    "doctor": { "id": 1, "name": "Dr. Sarah Johnson" }
  }
}
```

You can also update just the `status` (e.g., mark as completed):
```json
{
  "status": "COMPLETED"
}
```

---

#### 4.5 — Cancel an appointment

> Requires ADMIN or RECEPTIONIST role.

| Field | Value |
|-------|-------|
| Method | PATCH |
| URL | `http://localhost:5001/api/appointments/1/cancel` |
| Auth | Bearer Token → `{{token}}` |
| Body | None |

Expected response:
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "id": 1,
    "appointmentId": "APT-3F8C2D1E4B",
    "status": "CANCELLED",
    "patient": { "id": 1, "name": "John Doe" },
    "doctor": { "id": 1, "name": "Dr. Sarah Johnson" }
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
| `409` | Conflict — duplicate entry or double-booking |
| `500` | Internal Server Error — something went wrong on the server |

---

## Database Schema

| Model | Key Fields |
|-------|-----------|
| `User` | `id`, `username`, `password` (hashed), `fullName`, `role` (ADMIN/RECEPTIONIST/STAFF), `isActive`, `passwordResetToken`, `passwordResetExpiry` |
| `Patient` | `id`, `patientId` (PAT-XXXXX), `name`, `age`, `gender`, `contactNumber`, `address`, `medicalHistory` |
| `Doctor` | `id`, `doctorId` (DOC-XXXXX), `name`, `specialization`, `contactNumber`, `availabilitySchedule` (JSON), `departmentId` |
| `Department` | `id`, `name`, `description` |
| `PatientDoctor` | `patientId`, `doctorId`, `assignedAt` (join table) |
| `Visit` | `id`, `patientId`, `doctorId`, `visitDate`, `diagnosis`, `summary` |
| `Appointment` | `id`, `appointmentId` (APT-XXXXX), `patientId`, `doctorId`, `dateTime`, `status` (SCHEDULED/CANCELLED/COMPLETED/RESCHEDULED), `notes` |
| `AuditLog` | `id`, `userId`, `action`, `entity`, `entityId`, `details`, `createdAt` |
| `HospitalSettings` | `id`, `key`, `value` |

---

## Stopping the Database

```bash
docker-compose down          # Stop the container (data is preserved)
docker-compose down -v       # Stop and permanently delete all data
```
