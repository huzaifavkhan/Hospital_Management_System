const prisma = require('../db/prisma');

const SENSITIVE_FIELDS = ['password', 'token', 'accessToken', 'refreshToken', 'secret'];

function redactSensitiveFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      SENSITIVE_FIELDS.includes(key)
        ? '[REDACTED]'
        : value && typeof value === 'object'
        ? redactSensitiveFields(value)
        : value,
    ])
  );
}

const auditLog = (action, entity) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        const entityId = req.params.id || undefined;
        const safeBody = req.method !== 'GET' ? redactSensitiveFields(req.body) : undefined;

        prisma.auditLog
          .create({
            data: {
              userId: req.user ? req.user.id : null,
              action,
              entity,
              entityId: entityId ? String(entityId) : null,
              details: {
                method: req.method,
                path: req.path,
                body: safeBody,
              },
            },
          })
          .catch((err) => console.error('Audit log error:', err.message));
      }
    });

    next();
  };
};

module.exports = { auditLog };
