const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      if (res.statusCode < 400) {
        try {
          const entityId =
            req.params.id ||
            (body && body.data && (body.data.id || body.data.patientId || body.data.doctorId));

          await prisma.auditLog.create({
            data: {
              userId: req.user ? req.user.id : null,
              action,
              entity,
              entityId: entityId ? String(entityId) : null,
              details: {
                method: req.method,
                path: req.path,
                body: req.method !== 'GET' ? req.body : undefined,
              },
            },
          });
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = { auditLog };
