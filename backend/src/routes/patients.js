const express = require('express');
const router = express.Router();
const patientService = require('../services/patientService');
const { authenticate, requireAdminOrReceptionist } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// All patient routes require authentication
router.use(authenticate);

// GET /api/patients?page=1&limit=10&search=john
router.get('/', async (req, res, next) => {
  try {
    const result = await patientService.getAllPatients(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

// POST /api/patients
router.post(
  '/',
  requireAdminOrReceptionist,
  auditLog('CREATE', 'Patient'),
  async (req, res, next) => {
    try {
      const patient = await patientService.createPatient(req.body);
      res.status(201).json({ success: true, message: 'Patient registered successfully', data: patient });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/patients/:id
router.put(
  '/:id',
  requireAdminOrReceptionist,
  auditLog('UPDATE', 'Patient'),
  async (req, res, next) => {
    try {
      const patient = await patientService.updatePatient(req.params.id, req.body);
      res.json({ success: true, message: 'Patient updated successfully', data: patient });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/patients/:id
router.delete(
  '/:id',
  requireAdminOrReceptionist,
  auditLog('DELETE', 'Patient'),
  async (req, res, next) => {
    try {
      const result = await patientService.deletePatient(req.params.id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
