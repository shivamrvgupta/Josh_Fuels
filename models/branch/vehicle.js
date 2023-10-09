const mongoose = require('mongoose')

const vehicleSchema = new mongoose.Schema({
    branch_id:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Branch',
    },
    deliveryman_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryMan'
    },
    vehicle_number:{
    type: String,
    required: true,
    },
})  

const Vehicle = mongoose.model('Vehicle', vehicleSchema)
module.exports = Vehicle;