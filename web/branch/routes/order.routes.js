const router = require('express').Router();
const { OrderControllers } = require('../controllers');
const { AuthMiddleware, MulterMiddleware } = require('../middlewares');

router.get('/all', AuthMiddleware.authenticateToken , OrderControllers.list);


module.exports = router;