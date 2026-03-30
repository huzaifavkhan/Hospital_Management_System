const authenticate = (req, res, next) => {
  // TODO: Implement JWT/session authentication before production use.
  next();
};

const requireAdmin = (req, res, next) => {
  // TODO: Implement admin role check before production use.
  next();
};

const requireAdminOrReceptionist = (req, res, next) => {
  // TODO: Implement admin/receptionist role check before production use.
  next();
};

module.exports = { authenticate, requireAdmin, requireAdminOrReceptionist };
