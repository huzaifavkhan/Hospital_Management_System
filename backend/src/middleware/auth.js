/**
 * Authentication and authorization middleware.
 *
 * These are stub implementations that unconditionally pass every request
 * through so the router module can be required without crashing.  Replace the
 * bodies with real JWT verification / RBAC logic when the auth system is
 * integrated.
 */

const authenticate = (req, res, next) => {
  next();
};

const requireAdminOrReceptionist = (req, res, next) => {
  next();
};

module.exports = { authenticate, requireAdminOrReceptionist };
