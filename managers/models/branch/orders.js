const mongoose = require('mongoose');
const createdDate = new Date();
const ist = createdDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

const orderSchema = new mongoose.Schema({
    order_id:{
        type : String,
        required : true
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    product_items : [{ 
        product_id:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'BranchProduct',
        },
        quantity : {
            type: Number,
            required: true,
            default: 0.00,
            set: function(value) {
              return parseFloat(value).toFixed(2);
          }
        },
        price : {
            type: Number,
            required: true,
            default: 0.00,
            set: function(value) {
              return parseFloat(value).toFixed(2);
            }
        }
    }],
    address_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    },
    branch_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
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
    delivery_date: {
        type: String,
        required: true,
    },
    delivery_time: {
        type: String,
        required: true,
    },
    is_scheduled_for_later: {
        type : Boolean,
        required: true,
        default: false,
    },
    payment_method: {
        type: String,
        required: true,
    },
    payment_status: {
        type : Boolean,
        default: false,
    },
    note : {
        type: String,
        required: true,
    },
    grand_total : {
        type: Number,
        required: true,
        default: 0.00,
        set: function(value) {
          return parseFloat(value).toFixed(2);
        }
    },
    delivery_id :{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryMan',
    },
    delivery_man :{ 
        type: String,
        default: "Not Assigned",
    },
    esitmated_delivery_time : {
        type: String,
        required: true,
        default : "6:00 PM",
    },
    is_delivery_man_assigned :{
        type: Boolean,
        default: false,
    },
    is_delivered :{
        type: Boolean,
        default: false,
    },
    is_cancelled :{
        type: Boolean,
        default: false,
    },
    status :{ 
        type: String,
        default: "Pending",
    },
    created_date: {
        type: Date,
        default: Date.now,
    },
    updated_date: {
        type: Date,
        default: Date.now,
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;