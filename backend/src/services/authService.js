const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const register = async ({ username, password, fullName, role }) => {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    const err = new Error('Username already exists');
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hashed, fullName, role: role || 'RECEPTIONIST' },
    select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true },
  });
  return user;
};

const login = async ({ username, password }) => {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials or account deactivated');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  };
};

// Login restricted to a specific role
const loginAs = async ({ username, password, requiredRole }) => {
  const result = await login({ username, password });
  if (result.user.role !== requiredRole) {
    const err = new Error(`Access denied: this login is for ${requiredRole.toLowerCase()}s only`);
    err.status = 403;
    throw err;
  }
  return result;
};

// Change password for an authenticated user (requires current password)
const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    const err = new Error('currentPassword and newPassword are required');
    err.status = 400;
    throw err;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    const err = new Error('Current password is incorrect');
    err.status = 401;
    throw err;
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { message: 'Password changed successfully' };
};

// Generate a reset token (token only returned in explicit non-production environments for testability)
const forgotPassword = async ({ username }) => {
  if (!username) {
    const err = new Error('username is required');
    err.status = 400;
    throw err;
  }
  const exposeResetToken =
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const response = {
    message: 'If that username exists, a reset token has been generated',
    ...(exposeResetToken ? { resetToken: null } : {}),
  };

  const user = await prisma.user.findUnique({ where: { username } });
  // Always respond the same way to avoid user enumeration
  if (!user || !user.isActive) {
    return response;
  }

  const token = crypto.randomBytes(32).toString('hex');
  // Store a hash of the token so plaintext is never persisted
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: tokenHash, passwordResetExpiry: expiry },
  });

  if (exposeResetToken) {
    response.resetToken = token;
  }

  return response;
};

// Reset password using the token
const resetPassword = async ({ resetToken, newPassword }) => {
  if (!resetToken || !newPassword) {
    const err = new Error('resetToken and newPassword are required');
    err.status = 400;
    throw err;
  }
  // Hash the incoming token to compare against the stored hash
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpiry: { gte: new Date() },
      isActive: true,
    },
  });
  if (!user) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
  });
  return { message: 'Password reset successfully' };
};

module.exports = { register, login, loginAs, changePassword, forgotPassword, resetPassword };
