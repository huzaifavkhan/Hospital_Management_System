/**
 * Audit-logging middleware.
 *
 * Returns an Express middleware function that records a structured audit entry
 * for the given action / entity pair.  The current implementation logs to
 * stdout; replace with a database write or dedicated logging service as needed.
 */

const auditLog = (action, entity) => {
  return (req, res, next) => {
    console.log(`[AUDIT] action=${action} entity=${entity} ip=${req.ip} user=${req.user && req.user.id}`);
    next();
  };
};

module.exports = { auditLog };
