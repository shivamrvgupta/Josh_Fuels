const router = require('express').Router();
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const SubCategoryRoutes = require('./subCategory.routes');
const AddonRoutes = require('./addon.routes');
const ProductRoutes = require('./product.route');
const BranchRoutes = require('./branch.routes');
const DeliveryManRoutes = require('./deliveryman.routes');
const CustomerRoutes = require('./customer.routes');
const OrderRoutes = require('./order.routes');
const VehicleRoutes = require('./vehicle.routes');

router.use('/auth', authRoutes);
router.use('/category', categoryRoutes);
router.use('/category', SubCategoryRoutes);
router.use('/addon', AddonRoutes);
router.use('/product', ProductRoutes);
router.use('/branch', BranchRoutes);
router.use('/deliveryman', DeliveryManRoutes);
router.use('/customer', CustomerRoutes);
router.use('/orders', OrderRoutes);
router.use('/vehicle', VehicleRoutes);

module.exports = router;
