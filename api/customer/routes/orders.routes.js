const router = require('express').Router();
const { OrderController } = require('../controllers');
const { AuthMiddleware } = require('../middlewares');


router.get('/get', AuthMiddleware.authenticateToken ,OrderController.orderList);
router.post('/add', AuthMiddleware.authenticateToken ,OrderController.addOrder);
router.post('/delete', AuthMiddleware.authenticateToken ,OrderController.deleteOrder);

module.exports = router;