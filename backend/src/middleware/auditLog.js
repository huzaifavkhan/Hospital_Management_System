const auditLog = (action, entity) => {
  // TODO: Implement audit logging (action, entity) before production use.
  return (req, res, next) => {
    next();
  };
};

module.exports = { auditLog };
