const router = require('express').Router();
const { VehicleControllers } = require('../controllers');
const { AuthMiddleware, MulterMiddleware } = require('../middlewares');

router.get('/list', AuthMiddleware.authenticateToken , VehicleControllers.list);
router.get('/add', AuthMiddleware.authenticateToken , VehicleControllers.getAdd);
router.get('/update/:vehicleId', AuthMiddleware.authenticateToken , VehicleControllers.getUpdate);
router.get('/getDeliveryman',  VehicleControllers.getDeliveryMan);


router.post('/add', AuthMiddleware.authenticateToken , VehicleControllers.postAdd);

router.post('delete', AuthMiddleware.authenticateToken , VehicleControllers.updateStatus);

router.post('/update/:vehicleId', AuthMiddleware.authenticateToken , VehicleControllers.postUpdate);


module.exports = router;
