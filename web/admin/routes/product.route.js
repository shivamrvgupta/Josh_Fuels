const router = require('express').Router();
const { ProductController } = require('../controllers');
const { AuthMiddleware, MulterMiddleware } = require('../middlewares');

router.get('/lists', AuthMiddleware.authenticateToken , ProductController.list);
router.get('/add', AuthMiddleware.authenticateToken , ProductController.getAdd);
router.get('/getSubcategories',  ProductController.getSubcategories);
router.get('/update/:id', AuthMiddleware.authenticateToken , ProductController.getUpdate);
router.get('/detail/:id', AuthMiddleware.authenticateToken , ProductController.getDetail);


router.post('/add', MulterMiddleware.upload.fields([
    { name: 'image', maxCount: 1 }
]),AuthMiddleware.authenticateToken , ProductController.postAdd);

router.post('/update/:productId',   MulterMiddleware.upload.fields([
    { name: 'image', maxCount: 1 }
]),AuthMiddleware.authenticateToken , ProductController.postUpdate);

router.delete('/delete/:productId', AuthMiddleware.authenticateToken, ProductController.delete)

module.exports = router;
