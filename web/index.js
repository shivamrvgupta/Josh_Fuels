const router = require('express').Router();
const admin = require('./admin');
const branch = require('./branch');

router.use('/admin', admin);
router.use('/branch', branch);


module.exports = router;