const mongoose = require('mongoose');


const ordersSchema = new mongoose.Schema({
  branch_id:{
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    }
  },
  token: {
    type: String,
    required:true
  },
  name: {
    type: String,
    required:true
  },
  description: {
    type: String,
    required:true
  },
  price: {
    type: Number,
    required: true,
    default: 0.00,
    set: function(value) {
      return parseFloat(value).toFixed(2);
    }
  },
  tax: {
    type: Number,
    required: true,
    default: 0.00,
  },
  tax_type: {
    type: String,
    required: true,
    default: 'percent',
  },
  discount: {
    type: Number,
    required: true,
    default: 0.00,
  },
  discount_type: {
    type: String,
    required: true,
    default: 'percent',
  },  
  discounted_price: {
    type: Number, // Store the discounted price
  },
  category: {
    type: String,
    required: true,
  },
  sub_category: {
    type: String,
    required: true,
  },
  addons: [{
    type: String,model
  }],
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
  },
  attribute: {
    type: String,
  },
  is_selling: {
    type:Boolean,
    default:false
  },
  prices_by_location: [
    {
      location: String,
      price: {
        type: Number,
        required: true,
        default: 0.00,
        set: function(value) {
            return parseFloat(value).toFixed(2);
            },
      },
    },
  ],

});


// Define a virtual property for discounted_price
ordersSchema.virtual('discounted_price_virtual').get(function () {
  return calculateDiscountedPrice(this.price, this.discount, this.discount_type);
});

// Calculate the discounted price
function calculateDiscountedPrice(originalPrice, discount, discountType) {
  if (discountType === 'percentage') {
    const discountAmount = (discount / 100) * originalPrice;
    return originalPrice - discountAmount;
  } else if (discountType === 'amount') {
    return originalPrice - discount;
  } else {
    throw new Error('Invalid discount type');
  }
}

// Use pre('save') middleware to calculate and store the discounted_price before saving
ordersSchema.pre('save', function (next) {
  this.discounted_price = calculateDiscountedPrice(this.price, this.discount, this.discount_type);
  next();
});

const Orders = mongoose.model('orders', ordersSchema);

module.exports = Orders;