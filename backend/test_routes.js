/**
 * HMS Route Test Suite
 * Run: node test_routes.js
 * Requires the server to be running on http://localhost:5001
 */

require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:5001';
const ADMIN_USER = process.env.SEED_ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.SEED_ADMIN_PASSWORD || 'change_me_before_seeding';
const RECEP_USER = process.env.SEED_RECEPTIONIST_USERNAME || 'receptionist';
const RECEP_PASS = process.env.SEED_RECEPTIONIST_PASSWORD || 'change_me_before_seeding';

// ── HTTP helpers ─────────────────────────────────────────────────────────────

const request = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const url = new URL(path, BASE);
    const req = http.request(url, opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

const get  = (path, token)        => request('GET',    path, null, token);
const post = (path, body, token)  => request('POST',   path, body, token);
const put  = (path, body, token)  => request('PUT',    path, body, token);
const del  = (path, token)        => request('DELETE', path, null, token);
const patch = (path, body, token) => request('PATCH',  path, body, token);

// ── Reporter ─────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;
const results = [];

function check(label, res, expectedStatus, extraCheck) {
  const statusOk = res.status === expectedStatus;
  const extraOk  = extraCheck ? extraCheck(res.body) : true;
  const ok       = statusOk && extraOk;
  ok ? passed++ : failed++;
  const icon = ok ? '✅' : '❌';
  const detail = !statusOk
    ? ` (got ${res.status}, want ${expectedStatus})`
    : !extraOk ? ' (body check failed)' : '';
  results.push(`  ${icon} ${label}${detail}`);
  if (!ok) {
    results.push(`       Body: ${JSON.stringify(res.body).slice(0, 200)}`);
  }
}

function section(name) {
  results.push(`\n── ${name} ${'─'.repeat(Math.max(0, 60 - name.length))}`);
}

// ── Test runner ───────────────────────────────────────────────────────────────

async function run() {
  console.log('HMS Route Test Suite\n');
  console.log(`Admin:       ${ADMIN_USER}`);
  console.log(`Receptionist: ${RECEP_USER}`);
  console.log(`Base URL:    ${BASE}\n`);

  let adminToken, receptionistToken;
  let patientId, doctorId, departmentId, visitId, appointmentId, userId;
  let resetToken;

  // ── Health ──────────────────────────────────────────────────────────────────
  section('Health Check');
  {
    const r = await get('/health');
    check('GET /health', r, 200, b => b.status === 'ok');
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  section('Authentication');
  {
    // Generic login - admin
    const r1 = await post('/api/auth/login', { username: ADMIN_USER, password: ADMIN_PASS });
    check('POST /api/auth/login (admin)', r1, 200, b => !!b.data?.token);
    adminToken = r1.body?.data?.token;

    // Generic login - receptionist
    const r2 = await post('/api/auth/login', { username: RECEP_USER, password: RECEP_PASS });
    check('POST /api/auth/login (receptionist)', r2, 200, b => !!b.data?.token);
    receptionistToken = r2.body?.data?.token;

    // Role-specific login - admin endpoint
    const r3 = await post('/api/auth/login/admin', { username: ADMIN_USER, password: ADMIN_PASS });
    check('POST /api/auth/login/admin (correct role)', r3, 200, b => b.data?.user?.role === 'ADMIN');

    // Role-specific login - admin endpoint rejects receptionist
    const r4 = await post('/api/auth/login/admin', { username: RECEP_USER, password: RECEP_PASS });
    check('POST /api/auth/login/admin (wrong role → 403)', r4, 403);

    // Role-specific login - receptionist endpoint
    const r5 = await post('/api/auth/login/receptionist', { username: RECEP_USER, password: RECEP_PASS });
    check('POST /api/auth/login/receptionist (correct role)', r5, 200, b => b.data?.user?.role === 'RECEPTIONIST');

    // Role-specific login - receptionist endpoint rejects admin
    const r6 = await post('/api/auth/login/receptionist', { username: ADMIN_USER, password: ADMIN_PASS });
    check('POST /api/auth/login/receptionist (wrong role → 403)', r6, 403);

    // Missing credentials
    const r7 = await post('/api/auth/login', { username: ADMIN_USER });
    check('POST /api/auth/login (missing password → 400)', r7, 400);

    // Wrong password
    const r8 = await post('/api/auth/login', { username: ADMIN_USER, password: 'wrongpass' });
    check('POST /api/auth/login (wrong password → 401)', r8, 401);

    // Forgot password
    const r9 = await post('/api/auth/forgot-password', { username: RECEP_USER });
    check('POST /api/auth/forgot-password', r9, 200, b => !!b.resetToken);
    resetToken = r9.body?.resetToken;

    // Reset password
    if (resetToken) {
      const newPass = 'TempPass_HMS_123';
      const r10 = await post('/api/auth/reset-password', { resetToken, newPassword: newPass });
      check('POST /api/auth/reset-password', r10, 200, b => b.success);

      // Login with new password
      const r11 = await post('/api/auth/login', { username: RECEP_USER, password: newPass });
      check('Login with reset password', r11, 200, b => !!b.data?.token);
      receptionistToken = r11.body?.data?.token;

      // Restore original password via change-password
      const r12 = await post('/api/auth/change-password',
        { currentPassword: newPass, newPassword: RECEP_PASS },
        receptionistToken
      );
      check('POST /api/auth/change-password (restore)', r12, 200, b => b.success);

      // Refresh token after restore
      const r13 = await post('/api/auth/login', { username: RECEP_USER, password: RECEP_PASS });
      if (r13.body?.data?.token) receptionistToken = r13.body.data.token;
    }

    // Expired/invalid reset token
    const r14 = await post('/api/auth/reset-password', { resetToken: 'invalid_token_xyz', newPassword: 'abc' });
    check('POST /api/auth/reset-password (invalid token → 400)', r14, 400);

    // No auth on protected route
    const r15 = await get('/api/patients');
    check('GET /api/patients (no token → 401)', r15, 401);
  }

  // ── Patients ────────────────────────────────────────────────────────────────
  section('Patient Management');
  {
    // Create
    const r1 = await post('/api/patients', {
      name: 'Test Patient',
      age: 30,
      gender: 'Male',
      contactNumber: '+1-555-TEST',
      address: '99 Test Lane',
      medicalHistory: 'None',
    }, adminToken);
    check('POST /api/patients', r1, 201, b => !!b.data?.patientId);
    patientId = r1.body?.data?.id;

    // Missing required field
    const r2 = await post('/api/patients', { name: 'Incomplete' }, adminToken);
    check('POST /api/patients (missing fields → 400)', r2, 400);

    // List
    const r3 = await get('/api/patients?page=1&limit=5', adminToken);
    check('GET /api/patients', r3, 200, b => Array.isArray(b.data?.patients));

    // Search
    const r4 = await get('/api/patients?search=Test Patient', adminToken);
    check('GET /api/patients?search=', r4, 200, b => Array.isArray(b.data?.patients));

    // Get by ID
    const r5 = await get(`/api/patients/${patientId}`, adminToken);
    check('GET /api/patients/:id', r5, 200, b => b.data?.id === patientId);

    // Not found
    const r6 = await get('/api/patients/999999', adminToken);
    check('GET /api/patients/:id (not found → 404)', r6, 404);

    // Update
    const r7 = await put(`/api/patients/${patientId}`, { age: 31, address: 'Updated Address' }, adminToken);
    check('PUT /api/patients/:id', r7, 200, b => b.data?.age === 31);

    // STAFF cannot mutate
    const r8 = await post('/api/patients', {
      name: 'X', age: 1, gender: 'M', contactNumber: '0', address: 'X'
    }, receptionistToken);
    check('POST /api/patients as RECEPTIONIST (allowed)', r8, 201);
    // clean up the extra patient
    if (r8.body?.data?.id) await del(`/api/patients/${r8.body.data.id}`, adminToken);
  }

  // ── Visits ──────────────────────────────────────────────────────────────────
  section('Visit History');
  {
    // Need a doctor first — create one temporarily
    const rd = await post('/api/doctors', {
      name: 'Dr. Temp Visit',
      specialization: 'Testing',
      contactNumber: '+1-555-TEMP',
    }, adminToken);
    const tempDoctorId = rd.body?.data?.id;

    // Log visit
    const r1 = await post(`/api/patients/${patientId}/visits`, {
      doctorId: tempDoctorId,
      visitDate: '2024-03-10T09:00:00.000Z',
      diagnosis: 'Test Diagnosis',
      summary: 'Test visit summary',
    }, adminToken);
    check('POST /api/patients/:id/visits', r1, 201, b => !!b.data?.id);
    visitId = r1.body?.data?.id;

    // Missing required fields
    const r2 = await post(`/api/patients/${patientId}/visits`, { diagnosis: 'No date or doctor' }, adminToken);
    check('POST /api/patients/:id/visits (missing fields → 400)', r2, 400);

    // List visits
    const r3 = await get(`/api/patients/${patientId}/visits`, adminToken);
    check('GET /api/patients/:id/visits', r3, 200, b => Array.isArray(b.data));

    // Patient not found
    const r4 = await get('/api/patients/999999/visits', adminToken);
    check('GET /api/patients/:id/visits (patient not found → 404)', r4, 404);

    // Update visit
    const r5 = await put(`/api/patients/${patientId}/visits/${visitId}`, {
      diagnosis: 'Updated Diagnosis',
    }, adminToken);
    check('PUT /api/patients/:id/visits/:visitId', r5, 200, b => b.data?.diagnosis === 'Updated Diagnosis');

    // Delete visit
    const r6 = await del(`/api/patients/${patientId}/visits/${visitId}`, adminToken);
    check('DELETE /api/patients/:id/visits/:visitId', r6, 200, b => b.success);

    // Clean up temp doctor
    if (tempDoctorId) await del(`/api/doctors/${tempDoctorId}`, adminToken);
  }

  // ── Doctors ─────────────────────────────────────────────────────────────────
  section('Doctor Operations');
  {
    // Get department ID first
    const depts = await get('/api/admin/departments', adminToken);
    departmentId = depts.body?.data?.[0]?.id;

    // Create doctor
    const r1 = await post('/api/doctors', {
      name: 'Dr. Test Doctor',
      specialization: 'Cardiology',
      contactNumber: '+1-555-0200',
      departmentId,
      availabilitySchedule: { monday: { start: '09:00', end: '17:00' } },
    }, adminToken);
    check('POST /api/doctors', r1, 201, b => !!b.data?.doctorId);
    doctorId = r1.body?.data?.id;

    // Missing required fields
    const r2 = await post('/api/doctors', { name: 'No Spec' }, adminToken);
    check('POST /api/doctors (missing fields → 400)', r2, 400);

    // List
    const r3 = await get('/api/doctors?page=1&limit=5', adminToken);
    check('GET /api/doctors', r3, 200, b => Array.isArray(b.data?.doctors));

    // Search by name
    const r4 = await get('/api/doctors?search=Test Doctor', adminToken);
    check('GET /api/doctors?search=', r4, 200, b => Array.isArray(b.data?.doctors));

    // Filter by specialization
    const r5 = await get('/api/doctors?specialization=Cardiology', adminToken);
    check('GET /api/doctors?specialization=', r5, 200, b => Array.isArray(b.data?.doctors));

    // Get by ID
    const r6 = await get(`/api/doctors/${doctorId}`, adminToken);
    check('GET /api/doctors/:id', r6, 200, b => b.data?.id === doctorId);

    // Not found
    const r7 = await get('/api/doctors/999999', adminToken);
    check('GET /api/doctors/:id (not found → 404)', r7, 404);

    // Update
    const r8 = await put(`/api/doctors/${doctorId}`, { specialization: 'Neurology' }, adminToken);
    check('PUT /api/doctors/:id', r8, 200, b => b.data?.specialization === 'Neurology');

    // Assign patient
    const r9 = await post(`/api/doctors/${doctorId}/assign-patient`, { patientId }, adminToken);
    check('POST /api/doctors/:id/assign-patient', r9, 201, b => b.success);

    // Duplicate assignment
    const r10 = await post(`/api/doctors/${doctorId}/assign-patient`, { patientId }, adminToken);
    check('POST /api/doctors/:id/assign-patient (duplicate → 409)', r10, 409);

    // Get assigned patients
    const r11 = await get(`/api/doctors/${doctorId}/patients`, adminToken);
    check('GET /api/doctors/:id/patients', r11, 200, b => Array.isArray(b.data));

    // Unassign patient
    const r12 = await del(`/api/doctors/${doctorId}/unassign-patient/${patientId}`, adminToken);
    check('DELETE /api/doctors/:id/unassign-patient/:patientId', r12, 200, b => b.success);

    // RECEPTIONIST cannot delete doctor
    const r13 = await del(`/api/doctors/${doctorId}`, receptionistToken);
    check('DELETE /api/doctors/:id as RECEPTIONIST (→ 403)', r13, 403);
  }

  // ── Appointments ─────────────────────────────────────────────────────────────
  section('Appointment & Scheduling');
  {
    const apptTime = '2025-12-01T10:00:00.000Z';

    // Book appointment
    const r1 = await post('/api/appointments', {
      patientId,
      doctorId,
      dateTime: apptTime,
      notes: 'Test appointment',
    }, adminToken);
    check('POST /api/appointments', r1, 201, b => !!b.data?.appointmentId);
    appointmentId = r1.body?.data?.id;

    // Double booking (same doctor, same time)
    const r2 = await post('/api/appointments', {
      patientId,
      doctorId,
      dateTime: apptTime,
    }, adminToken);
    check('POST /api/appointments (double-booking → 409)', r2, 409);

    // Missing required fields
    const r3 = await post('/api/appointments', { patientId }, adminToken);
    check('POST /api/appointments (missing fields → 400)', r3, 400);

    // Patient not found
    const r4 = await post('/api/appointments', {
      patientId: 999999, doctorId, dateTime: '2025-12-02T10:00:00.000Z',
    }, adminToken);
    check('POST /api/appointments (bad patientId → 404)', r4, 404);

    // List all
    const r5 = await get('/api/appointments', adminToken);
    check('GET /api/appointments', r5, 200, b => Array.isArray(b.data?.appointments));

    // Filter by patient
    const r6 = await get(`/api/appointments?patientId=${patientId}`, adminToken);
    check('GET /api/appointments?patientId=', r6, 200, b => Array.isArray(b.data?.appointments));

    // Filter by status
    const r7 = await get('/api/appointments?status=SCHEDULED', adminToken);
    check('GET /api/appointments?status=SCHEDULED', r7, 200, b => Array.isArray(b.data?.appointments));

    // Invalid status
    const r8 = await get('/api/appointments?status=INVALID', adminToken);
    check('GET /api/appointments?status=INVALID (→ 400)', r8, 400);

    // Get by ID
    const r9 = await get(`/api/appointments/${appointmentId}`, adminToken);
    check('GET /api/appointments/:id', r9, 200, b => b.data?.id === appointmentId);

    // Not found
    const r10 = await get('/api/appointments/999999', adminToken);
    check('GET /api/appointments/:id (not found → 404)', r10, 404);

    // Reschedule
    const r11 = await put(`/api/appointments/${appointmentId}`, {
      dateTime: '2025-12-01T15:00:00.000Z',
      notes: 'Rescheduled',
    }, adminToken);
    check('PUT /api/appointments/:id (reschedule)', r11, 200, b => b.data?.status === 'RESCHEDULED');

    // Mark completed
    const r12 = await put(`/api/appointments/${appointmentId}`, { status: 'COMPLETED' }, adminToken);
    check('PUT /api/appointments/:id (status → COMPLETED)', r12, 200, b => b.data?.status === 'COMPLETED');

    // Book another to test cancel
    const r13 = await post('/api/appointments', {
      patientId, doctorId, dateTime: '2025-12-03T10:00:00.000Z',
    }, adminToken);
    const cancelId = r13.body?.data?.id;

    // Cancel
    const r14 = await patch(`/api/appointments/${cancelId}/cancel`, null, adminToken);
    check('PATCH /api/appointments/:id/cancel', r14, 200, b => b.data?.status === 'CANCELLED');

    // Cancel already cancelled
    const r15 = await patch(`/api/appointments/${cancelId}/cancel`, null, adminToken);
    check('PATCH /api/appointments/:id/cancel (already cancelled → 400)', r15, 400);
  }

  // ── Admin ────────────────────────────────────────────────────────────────────
  section('Administrative Control');
  {
    // Stats
    const r1 = await get('/api/admin/stats', adminToken);
    check('GET /api/admin/stats', r1, 200, b =>
      typeof b.data?.totalPatients === 'number' &&
      typeof b.data?.todaysAppointments === 'number'
    );

    // Non-admin blocked
    const r2 = await get('/api/admin/stats', receptionistToken);
    check('GET /api/admin/stats as RECEPTIONIST (→ 403)', r2, 403);

    // Departments - list
    const r3 = await get('/api/admin/departments', adminToken);
    check('GET /api/admin/departments', r3, 200, b => Array.isArray(b.data));

    // Departments - get by ID
    const r4 = await get(`/api/admin/departments/${departmentId}`, adminToken);
    check('GET /api/admin/departments/:id', r4, 200, b => b.data?.id === departmentId);

    // Departments - create
    const r5 = await post('/api/admin/departments', { name: 'HMS Test Dept', description: 'Test' }, adminToken);
    check('POST /api/admin/departments', r5, 201, b => b.data?.name === 'HMS Test Dept');
    const testDeptId = r5.body?.data?.id;

    // Departments - duplicate
    const r6 = await post('/api/admin/departments', { name: 'HMS Test Dept' }, adminToken);
    check('POST /api/admin/departments (duplicate → 409)', r6, 409);

    // Departments - update
    const r7 = await put(`/api/admin/departments/${testDeptId}`, { name: 'HMS Test Dept Updated' }, adminToken);
    check('PUT /api/admin/departments/:id', r7, 200, b => b.data?.name === 'HMS Test Dept Updated');

    // Departments - delete
    const r8 = await del(`/api/admin/departments/${testDeptId}`, adminToken);
    check('DELETE /api/admin/departments/:id', r8, 200, b => b.success);

    // Users - list
    const r9 = await get('/api/admin/users', adminToken);
    check('GET /api/admin/users', r9, 200, b => Array.isArray(b.data?.users));

    // Users - filter by role
    const r10 = await get('/api/admin/users?role=RECEPTIONIST', adminToken);
    check('GET /api/admin/users?role=RECEPTIONIST', r10, 200, b => Array.isArray(b.data?.users));

    // Users - invalid role filter
    const r11 = await get('/api/admin/users?role=INVALID', adminToken);
    check('GET /api/admin/users?role=INVALID (→ 400)', r11, 400);

    // Users - create
    const r12 = await post('/api/admin/users', {
      username: 'hms_test_user_99',
      password: 'TestPass123',
      fullName: 'HMS Test User',
      role: 'STAFF',
    }, adminToken);
    check('POST /api/admin/users', r12, 201, b => b.data?.username === 'hms_test_user_99');
    userId = r12.body?.data?.id;

    // Users - duplicate username
    const r13 = await post('/api/admin/users', {
      username: 'hms_test_user_99', password: 'X', fullName: 'X',
    }, adminToken);
    check('POST /api/admin/users (duplicate → 409)', r13, 409);

    // Users - get by ID
    const r14 = await get(`/api/admin/users/${userId}`, adminToken);
    check('GET /api/admin/users/:id', r14, 200, b => b.data?.id === userId);

    // Users - update
    const r15 = await put(`/api/admin/users/${userId}`, { fullName: 'Updated HMS User', role: 'RECEPTIONIST' }, adminToken);
    check('PUT /api/admin/users/:id', r15, 200, b => b.data?.fullName === 'Updated HMS User');

    // Users - deactivate
    const r16 = await del(`/api/admin/users/${userId}`, adminToken);
    check('DELETE /api/admin/users/:id (deactivate)', r16, 200, b => b.success);

    // Reports - summary
    const r17 = await get('/api/admin/reports?type=summary', adminToken);
    check('GET /api/admin/reports?type=summary', r17, 200, b => b.data?.type === 'summary');

    // Reports - patients
    const r18 = await get('/api/admin/reports?type=patients', adminToken);
    check('GET /api/admin/reports?type=patients', r18, 200, b => b.data?.type === 'patients');

    // Reports - doctors
    const r19 = await get('/api/admin/reports?type=doctors', adminToken);
    check('GET /api/admin/reports?type=doctors', r19, 200, b => b.data?.type === 'doctors');

    // Reports - invalid type
    const r20 = await get('/api/admin/reports?type=invalid', adminToken);
    check('GET /api/admin/reports?type=invalid (→ 400)', r20, 400);

    // Audit logs
    const r21 = await get('/api/admin/audit-logs?page=1&limit=5', adminToken);
    check('GET /api/admin/audit-logs', r21, 200, b => Array.isArray(b.data?.logs));

    // Audit logs - filter
    const r22 = await get('/api/admin/audit-logs?entity=Patient', adminToken);
    check('GET /api/admin/audit-logs?entity=Patient', r22, 200, b => Array.isArray(b.data?.logs));

    // Settings - get
    const r23 = await get('/api/admin/settings', adminToken);
    check('GET /api/admin/settings', r23, 200, b => typeof b.data === 'object');

    // Settings - update
    const r24 = await put('/api/admin/settings', { hospital_name: 'HMS Test Hospital' }, adminToken);
    check('PUT /api/admin/settings', r24, 200, b => b.data?.hospital_name === 'HMS Test Hospital');

    // Restore original name
    await put('/api/admin/settings', { hospital_name: 'City General Hospital' }, adminToken);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  section('Cleanup');
  {
    if (patientId) {
      const r = await del(`/api/patients/${patientId}`, adminToken);
      check('DELETE test patient', r, 200, b => b.success);
    }
    if (doctorId) {
      const r = await del(`/api/doctors/${doctorId}`, adminToken);
      check('DELETE test doctor', r, 200, b => b.success);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  results.forEach(l => console.log(l));
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
