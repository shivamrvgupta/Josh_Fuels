const router = require('express').Router();
const { CustomerControllers } = require('../controllers');
const { AuthMiddleware, MulterMiddleware} = require('../middlewares');


router.get('/list', AuthMiddleware.authenticateToken ,CustomerControllers.list );
router.get('/detail/:customerId', AuthMiddleware.authenticateToken ,CustomerControllers.getCustomer );
router.get('/add', AuthMiddleware.authenticateToken ,CustomerControllers.getAdd);
router.get('/update/:customerId', AuthMiddleware.authenticateToken ,CustomerControllers.getUpdate);



router.post('/add', MulterMiddleware.upload.fields([
    { name: 'customer_image', maxCount: 1 }
  ]),
    AuthMiddleware.authenticateToken ,CustomerControllers.postAdd);

router.post('/update/:customerId', MulterMiddleware.upload.fields([
    { name: 'customer_image', maxCount: 1 }
  ]),
    AuthMiddleware.authenticateToken ,CustomerControllers.postUpdate);


router.delete('/delete/:customerId', AuthMiddleware.authenticateToken, CustomerControllers.delete)

router.post('/update-prime', AuthMiddleware.authenticateToken, CustomerControllers.updatePrivlage)

module.exports = router;
