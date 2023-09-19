const router = require('express').Router();
const { AddressController } = require('../controllers');
const { AuthMiddleware } = require('../middlewares');





router.post('/add-address',AuthMiddleware.authenticateToken ,AddressController.addAddress);
router.get('/get-address',AuthMiddleware.authenticateToken ,AddressController.getAddress);
router.post('/update-address',AuthMiddleware.authenticateToken ,AddressController.updateAddress);
router.delete('/delete-address',AuthMiddleware.authenticateToken ,AddressController.deleteAddress);

module.exports = router;