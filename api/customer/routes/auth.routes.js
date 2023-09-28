const router = require('express').Router();
const { AuthController } = require('../controllers');
const { AuthMiddleware } = require('../middlewares');


router.get('/test', (req, res) => {
  res.send('About birds');
});

router.post('/login', AuthController.login);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/register',AuthController.register);
// router.post('/add-address',AuthMiddleware.authenticateToken ,AuthController.addAddress);
router.post('/add-device',AuthMiddleware.authenticateToken ,AuthController.addDevice);
router.get('/userdata',AuthMiddleware.authenticateToken ,AuthController.getUser);
router.post('/logout', AuthMiddleware.authenticateToken ,AuthController.logout);

module.exports = router;