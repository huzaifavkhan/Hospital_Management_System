const express = require('express');
const router = express.Router();

/**
 * Safely require and mount a route module.
 * If the module does not exist, the route is skipped
 * so that the server can still start.
 */
function safeMount(path, modulePath) {
  let routeModule;
  try {
    routeModule = require(modulePath);
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      console.warn(`[router] Route module not found for "${path}" (${modulePath}) — skipping.`);
      return;
    }
    throw err;
  }
  router.use(path, routeModule);
}

safeMount('/auth', './auth');
safeMount('/patients', './patients');
safeMount('/doctors', './doctors');
safeMount('/admin', './admin');

module.exports = router;
