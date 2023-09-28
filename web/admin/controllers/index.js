const AuthController = require('./auth.Controllers');
const CategoryController = require('./category.Controllers');
const SubCategoryController = require('./subCategory.Controllers');
const AddonController = require('./addon.Controllers');
const ProductController = require('./products.Controllers');
const BranchControllers = require('./branch.Controllers');
const DeliveryManControllers = require('./deliveryman.Controllers');
const CustomerControllers = require('./customer.Controllers');
const OrderControllers = require('./order.Controllers');

module.exports = {
    AuthController,
    CategoryController,
    SubCategoryController,
    AddonController,
    ProductController,
    BranchControllers,
    DeliveryManControllers,
    CustomerControllers,
    OrderControllers
}