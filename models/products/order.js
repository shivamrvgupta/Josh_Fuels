const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  token: {
    type: String,
    required:true
  },
  order_Id: {
    type: String,
    required:true
  },
  date:{
    type: String,
    required:true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required:true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
    payment_Status:{
    type: Number,
    required: true,
    default: 0.00,
  },
  total: {
    type: String,
    required: true,
    default: 'percent',
  },
  status: {
    type: Boolean,
    default: true,
  },
  available_time_starts: {
    type: String,
    required:true
  },
  available_time_ends: {
    type: String,
    required:true
  },
  created_at: {
      type: Date,
      default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});



const Order = mongoose.model('Admin/Product', orderSchema);

module.exports = Order;