const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  token:{
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    default: 'def.png',
    required: true,
  },
  banner_image: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now, 
  },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;