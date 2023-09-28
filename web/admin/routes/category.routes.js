const router = require('express').Router();
const { CategoryController } = require('../controllers');
const { AuthMiddleware, MulterMiddleware } = require('../middlewares');


router.get('/all', AuthMiddleware.authenticateToken ,CategoryController.getCategory);

router.get('/add', AuthMiddleware.authenticateToken ,CategoryController.addCategory);

router.get('/update/:categoryId', AuthMiddleware.authenticateToken ,CategoryController.getEditCategory);

router.post('/add', MulterMiddleware.upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 },
  ]),
    AuthMiddleware.authenticateToken ,CategoryController.postCategory);

router.post('/update-status', AuthMiddleware.authenticateToken , CategoryController.updateStatus);

router.post('/update/:categoryId', MulterMiddleware.upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'banner_image', maxCount: 1 },
]),
  AuthMiddleware.authenticateToken ,CategoryController.updateCategory);

router.delete('/delete/:categoryId', AuthMiddleware.authenticateToken, CategoryController.deleteCategory)


module.exports = router;
