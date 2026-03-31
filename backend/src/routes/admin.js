const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.use(authenticate, requireAdmin);

// ── Statistics ───────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// ── Departments ──────────────────────────────────────────────────────────────

// GET /api/admin/departments
router.get('/departments', async (req, res, next) => {
  try {
    const departments = await adminService.getAllDepartments();
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/departments/:id
router.get('/departments/:id', async (req, res, next) => {
  try {
    const dept = await adminService.getDepartmentById(req.params.id);
    res.json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/departments
router.post('/departments', auditLog('CREATE', 'Department'), async (req, res, next) => {
  try {
    const dept = await adminService.createDepartment(req.body);
    res.status(201).json({ success: true, message: 'Department created successfully', data: dept });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/departments/:id
router.put('/departments/:id', auditLog('UPDATE', 'Department'), async (req, res, next) => {
  try {
    const dept = await adminService.updateDepartment(req.params.id, req.body);
    res.json({ success: true, message: 'Department updated successfully', data: dept });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/departments/:id
router.delete('/departments/:id', auditLog('DELETE', 'Department'), async (req, res, next) => {
  try {
    const result = await adminService.deleteDepartment(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const result = await adminService.getAllUsers(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users
router.post('/users', auditLog('CREATE', 'User'), async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', auditLog('UPDATE', 'User'), async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id  (deactivate)
router.delete('/users/:id', auditLog('DEACTIVATE', 'User'), async (req, res, next) => {
  try {
    const result = await adminService.deactivateUser(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

// ── Audit Logs ────────────────────────────────────────────────────────────────

// GET /api/admin/audit-logs?page=1&limit=20&entity=Patient&action=CREATE
router.get('/audit-logs', async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogs(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Reports ───────────────────────────────────────────────────────────────────

// GET /api/admin/reports?type=patients&from=2024-01-01&to=2024-12-31
router.get('/reports', async (req, res, next) => {
  try {
    const report = await adminService.generateReport(req.query);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────

// GET /api/admin/settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await adminService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/settings
router.put('/settings', auditLog('UPDATE', 'HospitalSettings'), async (req, res, next) => {
  try {
    const settings = await adminService.updateSettings(req.body);
    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
