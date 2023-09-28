const router = require('express').Router();
const { OrderController } = require('../controllers');
const { AuthMiddleware } = require('../middlewares');


router.get('/get', AuthMiddleware.authenticateToken ,OrderController.orderList);
router.get('/get-order', AuthMiddleware.authenticateToken ,OrderController.perOrder);
router.post('/add', AuthMiddleware.authenticateToken ,OrderController.addOrder);
router.post('/delete', AuthMiddleware.authenticateToken ,OrderController.deleteOrder);
router.post('/update', AuthMiddleware.authenticateToken ,OrderController.updateOrder);

module.exports = router;