const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const { authenticate } = require('../middleware/auth');

// GET /api/stats — available to all authenticated users
router.get('/', authenticate, async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
