const router = require('express').Router();
const authRoutes = require('./auth.routes');
const branchRotues = require('./branch.routes');
const cartRotues = require('./cart.routes');
const addressRotues = require('./address.routes');
const orderRoutes = require('./orders.routes')

router.use('/customer', authRoutes);
router.use('/customer', addressRotues);
router.use('/branch', branchRotues);
router.use('/cart', cartRotues);
router.use('/order', orderRoutes);


module.exports = router;
