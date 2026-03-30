const express = require('express');
const router = express.Router();
const doctorService = require('../services/doctorService');
const { authenticate, requireAdmin, requireAdminOrReceptionist } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/doctors?page=1&limit=10&search=cardio&departmentId=1&specialization=Cardiology
router.get('/', async (req, res, next) => {
  try {
    const result = await doctorService.getAllDoctors(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
});

// POST /api/doctors
router.post(
  '/',
  requireAdminOrReceptionist,
  auditLog('CREATE', 'Doctor'),
  async (req, res, next) => {
    try {
      const doctor = await doctorService.createDoctor(req.body);
      res.status(201).json({ success: true, message: 'Doctor registered successfully', data: doctor });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/doctors/:id
router.put(
  '/:id',
  requireAdminOrReceptionist,
  auditLog('UPDATE', 'Doctor'),
  async (req, res, next) => {
    try {
      const doctor = await doctorService.updateDoctor(req.params.id, req.body);
      res.json({ success: true, message: 'Doctor updated successfully', data: doctor });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/doctors/:id
router.delete(
  '/:id',
  requireAdmin,
  auditLog('DELETE', 'Doctor'),
  async (req, res, next) => {
    try {
      const result = await doctorService.deleteDoctor(req.params.id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/doctors/:id/patients
router.get('/:id/patients', async (req, res, next) => {
  try {
    const patients = await doctorService.getDoctorPatients(req.params.id);
    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
});

// POST /api/doctors/:id/assign-patient
router.post(
  '/:id/assign-patient',
  requireAdminOrReceptionist,
  auditLog('ASSIGN_PATIENT', 'Doctor'),
  async (req, res, next) => {
    try {
      const { patientId } = req.body;
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required' });
      }
      const assignment = await doctorService.assignPatient(req.params.id, patientId);
      res.status(201).json({ success: true, message: 'Patient assigned to doctor successfully', data: assignment });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/doctors/:id/unassign-patient/:patientId
router.delete(
  '/:id/unassign-patient/:patientId',
  requireAdminOrReceptionist,
  auditLog('UNASSIGN_PATIENT', 'Doctor'),
  async (req, res, next) => {
    try {
      const result = await doctorService.unassignPatient(req.params.id, req.params.patientId);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
