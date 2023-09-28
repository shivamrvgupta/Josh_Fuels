const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  created_at: {
      type: Date,
      default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
});


const Product = mongoose.model('BranchProduct', productSchema);

module.exports = Product;