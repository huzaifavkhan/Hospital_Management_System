const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, fullName } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'username, password, and fullName are required' });
    }
    const user = await authService.register({ username, password, fullName, role: 'RECEPTIONIST' });
    res.status(201).json({ success: true, message: 'User registered successfully', data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  (generic — works for any role)
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }
    const result = await authService.login({ username, password });
    res.json({ success: true, message: 'Login successful', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login/admin  (admin-only login)
router.post('/login/admin', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }
    const result = await authService.loginAs({ username, password, requiredRole: 'ADMIN' });
    res.json({ success: true, message: 'Admin login successful', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login/receptionist  (receptionist-only login)
router.post('/login/receptionist', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'username and password are required' });
    }
    const result = await authService.loginAs({ username, password, requiredRole: 'RECEPTIONIST' });
    res.json({ success: true, message: 'Receptionist login successful', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password  (authenticated — change own password)
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password  (generate reset token)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { username } = req.body;
    const result = await authService.forgotPassword({ username });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password  (use token to set new password)
router.post('/reset-password', async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await authService.resetPassword({ resetToken, newPassword });
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
