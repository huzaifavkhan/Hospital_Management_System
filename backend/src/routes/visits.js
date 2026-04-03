const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for :patientId
const visitService = require('../services/visitService');
const { authenticate, requireAdminOrReceptionist } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/patients/:patientId/visits
router.get('/', async (req, res, next) => {
  try {
    const visits = await visitService.getVisitsByPatient(req.params.patientId);
    res.json({ success: true, data: visits });
  } catch (err) {
    next(err);
  }
});

// POST /api/patients/:patientId/visits
router.post(
  '/',
  requireAdminOrReceptionist,
  auditLog('CREATE', 'Visit'),
  async (req, res, next) => {
    try {
      const visit = await visitService.createVisit(req.params.patientId, req.body);
      res.status(201).json({ success: true, message: 'Visit recorded successfully', data: visit });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/patients/:patientId/visits/:id
router.put(
  '/:id',
  requireAdminOrReceptionist,
  auditLog('UPDATE', 'Visit'),
  async (req, res, next) => {
    try {
      const visit = await visitService.updateVisit(req.params.patientId, req.params.id, req.body);
      res.json({ success: true, message: 'Visit updated successfully', data: visit });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/patients/:patientId/visits/:id
router.delete(
  '/:id',
  requireAdminOrReceptionist,
  auditLog('DELETE', 'Visit'),
  async (req, res, next) => {
    try {
      const result = await visitService.deleteVisit(req.params.patientId, req.params.id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
