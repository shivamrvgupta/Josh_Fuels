const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    branch_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
    },
    product_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BranchProduct',
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    quantity:{
        type: Number,
        required: true,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    price:{
        type: Number,
        required: true,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    coupon_discount:{
        type: Number,
        required: true,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    delivery_fee:{
        type: Number,
        required: true,
        default: 300.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    total_price:{
        type: Number,
        required: true,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;