const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/patients', require('./patients'));
router.use('/doctors', require('./doctors'));
router.use('/admin', require('./admin'));

module.exports = router;
