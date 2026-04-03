const express = require('express');
const router = express.Router();
const appointmentService = require('../services/appointmentService');
const { authenticate, requireAdminOrReceptionist } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/appointments?page=1&limit=10&patientId=&doctorId=&status=&from=&to=
router.get('/', async (req, res, next) => {
  try {
    const result = await appointmentService.getAllAppointments(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments
router.post(
  '/',
  requireAdminOrReceptionist,
  auditLog('CREATE', 'Appointment'),
  async (req, res, next) => {
    try {
      const appointment = await appointmentService.createAppointment(req.body);
      res.status(201).json({ success: true, message: 'Appointment booked successfully', data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/appointments/:id  (reschedule or update notes)
router.put(
  '/:id',
  requireAdminOrReceptionist,
  auditLog('UPDATE', 'Appointment'),
  async (req, res, next) => {
    try {
      const appointment = await appointmentService.updateAppointment(req.params.id, req.body);
      res.json({ success: true, message: 'Appointment updated successfully', data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/appointments/:id/cancel
router.patch(
  '/:id/cancel',
  requireAdminOrReceptionist,
  auditLog('CANCEL', 'Appointment'),
  async (req, res, next) => {
    try {
      const appointment = await appointmentService.cancelAppointment(req.params.id);
      res.json({ success: true, message: 'Appointment cancelled successfully', data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
