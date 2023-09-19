const router = require('express').Router();
const customer = require('./customer');

router.use('/auth', customer);

module.exports = router;