const router = require('express').Router();
const { DeliveryManControllers } = require('../controllers');
const { AuthMiddleware, MulterMiddleware } = require('../middlewares');

router.get('/list', AuthMiddleware.authenticateToken , DeliveryManControllers.list);
router.get('/add', AuthMiddleware.authenticateToken , DeliveryManControllers.getAdd);
router.get('/update/:deliverymanId', AuthMiddleware.authenticateToken , DeliveryManControllers.getUpdate);



router.post('/add', MulterMiddleware.upload.fields([
    { name: 'id_image', maxCount: 1 },       
    { name: 'deliveryman_image', maxCount: 1 },
]),AuthMiddleware.authenticateToken , DeliveryManControllers.postAdd);

router.post('/update-status', AuthMiddleware.authenticateToken , DeliveryManControllers.updateStatus);

router.post('/update/:deliveryManId',   MulterMiddleware.upload.fields([
    { name: 'id_image', maxCount: 1 },       
    { name: 'deliveryman_image', maxCount: 1 },
]),AuthMiddleware.authenticateToken , DeliveryManControllers.postUpdate);

router.delete('/delete/:deliveryManId', AuthMiddleware.authenticateToken, DeliveryManControllers.delete)

module.exports = router;
