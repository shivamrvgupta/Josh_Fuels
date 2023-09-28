const router = require('express').Router();
const { BranchControllers } = require('../controllers');
const { AuthMiddleware, MulterMiddleware } = require('../middlewares');

router.get('/all', AuthMiddleware.authenticateToken , BranchControllers.list);
router.get('/add', AuthMiddleware.authenticateToken , BranchControllers.getAdd);
router.get('/update/:branchId', AuthMiddleware.authenticateToken , BranchControllers.getUpdate);



router.post('/add', MulterMiddleware.upload.fields([
    { name: 'branch_image', maxCount: 1 }
]),AuthMiddleware.authenticateToken , BranchControllers.postAdd);

router.post('/update-status', AuthMiddleware.authenticateToken , BranchControllers.updateStatus);

router.post('/update/:branchId',   MulterMiddleware.upload.fields([
    { name: 'branch_image', maxCount: 1 }
]),AuthMiddleware.authenticateToken , BranchControllers.postUpdate);

router.delete('/delete/:branchId', AuthMiddleware.authenticateToken, BranchControllers.delete)

module.exports = router;
