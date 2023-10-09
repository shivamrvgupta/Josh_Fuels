const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        maxlength: 255
    },
    usertype :{
        type: String,
        default:"Branch",
    },
    name: {
        type: String,
        required: true,
        maxlength: 255
    },
    phone: {
        type: String,
        required: true,
        maxlength: 255
    },
    email: {
        type: String,
        required: true,
        maxlength: 255
    },
    password: {
        type: String,
        required: true
    },
    status:{
        type: Boolean,
        default: "true"
    },
    branch_image: {
        type: String,
        required: true,
    },
    address1: {
        type: String,
        required: true,
    },
    address2: {
        type: String,
    },
    area: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    deliverymen: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DeliveryMan',
        },
      ],
    vehicle:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },  
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
}
);

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
