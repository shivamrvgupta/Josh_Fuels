const mongoose = require('mongoose');

    // Define DeliveryMan schema
    const deliverymanSchema = new mongoose.Schema({
        token: {
            type : String,
            default: null
        }, 
        usertype:  { 
            type: String,
            required: true,
            default: "deliveryman",
            maxLength: 200
        },
        fname: {
            type: String,
            required: true,
            maxLength: 200
        },
        lname: {
            type: String,
            required: true,
            maxLength: 200
        },
        email:  { 
            type: String,
            required: true,
            maxLength: 200
        },
        phone:  { 
            type: String,
            required: true,
            maxLength: 200
        },
        branch:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
        },
        identity_type:{
            type: String,
            required: true,
            maxLength: 200
        },
        identity_number:{
            type: String,
            required: true,
            maxLength: 20
        },
        id_image:{
            type: String,
            required: true,
        },
        password:  { 
            type: String,
            required: false,
            maxLength: 200
        },
        deliveryman_image:{
            type: String,
            required: true,
        },
        is_active : {
            type: Boolean,
            default: true
        },
        created_date: {
            type:Date,
            default: Date.now
        },
        updated_date: {
            type:Date,
            default: Date.now
        }
    });

    
const DeliveryMan = mongoose.model('DeliveryMan', deliverymanSchema);
module.exports = DeliveryMan;