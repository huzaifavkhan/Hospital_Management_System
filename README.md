# Hospital Management System (HMS)

A full-stack Hospital Management System built for the Web-Based Application Development course.

## Project Overview

HMS is a role-based clinical management platform that streamlines patient registration, doctor scheduling, appointment booking, and hospital administration from a single trusted interface. It supports two user roles — **Admin** and **Receptionist** — each with tailored access controls.

## Features

### Authentication
- Separate login portals for Admin (`/login/admin`) and Receptionist (`/login/receptionist`)
- JWT-based authentication with auto-injection via Axios interceptors
- Persistent sessions (localStorage), auto-logout on token expiry
- Change password modal accessible from the user header dropdown

### Patient Management
- Register, view, edit, and delete patients
- Debounced search (300ms) by name, patient ID, or contact number
- Paginated patient list with striped table rows
- Patient detail page: full profile, assigned doctors panel, visit history timeline
- Log, edit, and delete visit records with doctor selection and date picker
- Assign/unassign doctors to patients

### Doctor Management
- Register, view, edit, and delete doctors (delete: Admin only; Receptionist sees disabled button)
- Filter by department and specialization
- Doctor detail page: info card, weekly availability grid (Mon–Sun with time ranges), assigned patients
- Assign patients to doctors via searchable modal dropdown
- Unassign patients with SweetAlert2 confirmation

### Appointment Scheduling
- Book appointments with typeahead patient/doctor search dropdowns
- Filter by patient name, doctor name, status, and date range
- Color-coded status badges: Scheduled (teal), Completed (green), Cancelled (red), Rescheduled (amber)
- Reschedule via modal, Cancel with confirmation, Mark Complete
- Double-booking error shown inline from backend 409 response

### Admin Panel (Admin only)
- **Dashboard**: Animated stat counters (count up from 0), department breakdown bar chart, recent activity feed
- **Departments**: Card-based CRUD — delete blocked with error toast if doctors are assigned
- **Users**: Create/edit admin and receptionist accounts, filter by role, deactivate with soft delete
- **Audit Logs**: Full activity trail, filter by entity type and action, expandable JSON detail viewer per row
- **Reports**: Generate Patients / Doctors / Summary reports with optional date range filter, export as JSON download
- **Settings**: Hospital name, contact, address, email — pre-filled from API, save with success toast

### UX Highlights
- SweetAlert2 for all confirmations, success toasts (`top-end`, 2s), and error alerts
- Skeleton loaders on all list views and stat cards during data fetch
- Illustrated empty states with icon + message + CTA on every list page
- Inline field-level error messages on all forms before submission
- Button spinner + disabled state while requests are in-flight
- Pagination controls (Prev/Next + "Page X of Y · Z results") on all paginated lists
- Fully responsive: collapsible sidebar with hamburger on mobile, horizontal scroll on tables
- 404 catch-all page with back button

### X-Factor Extras
- **Dark mode toggle** — persisted to localStorage, full Tailwind `dark:` class switch, accessible from header
- **Animated stat counters** — dashboard numbers count up from 0 on page load via `requestAnimationFrame` cubic ease-out

## Tech Stack

### Frontend
| Library | Purpose |
|---|---|
| React 18 | UI framework (functional components + hooks) |
| Vite 5 | Build tool and dev server |
| React Router v6 | Client-side routing with nested protected routes |
| Axios | HTTP client with JWT Bearer interceptor |
| Tailwind CSS v3 | Utility-first styling with dark mode (`class` strategy) |
| SweetAlert2 | Confirmation dialogs and toast notifications |
| Lucide React | Icon library |
| DM Sans + Syne | Google Fonts — body and heading typefaces |

### Backend
| Library | Purpose |
|---|---|
| Express.js | REST API server |
| PostgreSQL | Relational database |
| Prisma ORM | Database client and schema migrations |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |

## Setup Steps

### Prerequisites
- Node.js 18+
- Docker Desktop

### 1. Clone the repository
```bash
git clone <repo-url>
cd Hospital_Management_System
```

### 2. Start the database
```bash
docker-compose up -d
```

### 3. Backend setup
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```
Backend runs at `http://localhost:5001`

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

### 5. Default login credentials (from seed data)
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Receptionist | `receptionist` | `recept123` |

> Check `backend/prisma/seed.js` for the exact seeded credentials.

## Environment Variables

### `backend/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hms
JWT_SECRET=your_jwt_secret_here
PORT=5001
```

## Project Structure

```
Hospital_Management_System/
├── backend/
│   ├── src/
│   │   ├── routes/       auth.js, patients.js, doctors.js, appointments.js, visits.js, admin.js
│   │   ├── services/     patientService, doctorService, appointmentService, visitService, adminService, authService
│   │   ├── middleware/   auth.js (JWT guard, role checks), auditLog.js
│   │   └── utils/
│   └── prisma/           schema.prisma, migrations/, seed.js
├── frontend/
│   └── src/
│       ├── api/          axios.js (centralized instance + interceptors)
│       ├── context/      AuthContext.jsx (token, user, role, basePath)
│       ├── components/
│       │   ├── layout/   Sidebar.jsx, Header.jsx, Layout.jsx
│       │   ├── common/   Table.jsx, Modal.jsx, SearchInput.jsx, StatusBadge.jsx, SkeletonLoader.jsx, EmptyState.jsx
│       │   └── forms/    PatientForm.jsx, DoctorForm.jsx, AppointmentForm.jsx, VisitForm.jsx
│       ├── pages/
│       │   ├── Landing.jsx, LoginAdmin.jsx, LoginReceptionist.jsx, Dashboard.jsx, NotFound.jsx
│       │   ├── patients/     PatientList.jsx, PatientDetail.jsx
│       │   ├── doctors/      DoctorList.jsx, DoctorDetail.jsx
│       │   ├── appointments/ AppointmentList.jsx
│       │   └── admin/        AdminDashboard.jsx, Departments.jsx, Users.jsx, AuditLogs.jsx, Reports.jsx, Settings.jsx
│       ├── App.jsx           React Router v6 setup with PrivateRoute guards
│       └── index.css         Tailwind directives + custom CSS variables + animations
└── docker-compose.yml    PostgreSQL container definition
```

## Team Contributions

| Member | ID | Contributions |
|---|---|---|
| Huzaifa Ahmed Khan | 26485 | Complete React frontend — all pages, components, forms, routing, AuthContext, dark mode toggle, animated stat counters, responsive sidebar, SweetAlert2 integration, API wiring |
| Muhammad Bilal Adnan | 27151 | Express.js backend — all routes, service layer, Prisma schema, PostgreSQL migrations, JWT authentication system, audit log middleware, seed data |
