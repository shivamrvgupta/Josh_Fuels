const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const {
  MessageConstants,
  StatusCodesConstants,
  ParamsConstants,
  
} = require('../../../managers/notify');
const secretKey = process.env.SECRET_KEY
const {
  ImgServices
} = require('../../../managers/services');
const { generateAccessToken} = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');

// This would be your token blacklist storage
const tokenBlacklist = new Set();




module.exports = {

  // Get Product List
    list : async (req, res) => {
        try {
            const Vehicle = await models.BranchModel.Vehicle.find()
                .populate('deliveryman_id')
                .populate('branch_id')
        
            const VehicleCount = Vehicle.length;
            const user = req.user;
            if (!user) {
                return res.redirect('/admin/auth/login');
            }
            res.render('admin/vehicle/list', { Title: "Vehicle list", user, Vehicle, VehicleCount , error: "DeliveryMan List" })
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    },


  // Add Category List
    getAdd : async (req, res) => {
        try{
            const user = req.user;
            const branch = await models.BranchModel.Branch.find({});
            const deliveryman = await models.UserModel.DeliveryMan.find({});
            
            if (!user) {
                return res.redirect('/admin/auth/login');
            }
    
            res.render("admin/vehicle/add",{ Title: "Vehicle Registeration",user, branch, deliveryman , error: "Register a Vehicle" });
        }catch(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    },

    getDeliveryMan : async ( req, res ) =>{
        try {
            const branch_id = req.query.branch_id;
            const deliveryMan = await models.UserModel.DeliveryMan.find({ branch: branch_id });
            res.json(deliveryMan);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

  // Add Category List
    postAdd: async (req, res) => {
        try {
            const {vehicle_number, branch_id, deliveryman_id} = req.body;
        
            if (!vehicle_number || !branch_id || !deliveryman_id) {
                throw new Error('Required fields are missing.');
            }

            const vehicleData = {
                vehicle_number, 
                branch_id, 
                deliveryman_id,
                is_available : true
            };

            const vehicle = new models.BranchModel.Vehicle(vehicleData);
            await vehicle.save();
            console.log("Vehicle Added successfully");
            res.redirect('/admin/vehicle/list');
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    },


  // Update Status
    updateStatus : async (req, res) => {
        try {
            const vehicleId = req.body.vehicleId;
            console.log(vehicleId)
            // Find the branch in the database by ID
            const vehicle = await models.BranchModel.Vehicle.findById(vehicleId);
        
            if (!vehicle) {
                // Branch not found in the database
                return res.status(404).send('Vehicle not found');
            }
        
            // Toggle the status (true to false or false to true) and save the updated branch
            vehicle.is_available = !vehicle.is_available;
            await vehicle.save();
            
            console.log('Database value updated successfully');
            res.json({ is_available: vehicle.is_available }); // Respond with the updated status
        } catch (err) {
          console.error('Error updating database value: ', err);
            res.status(500).send('Error updating database value');
        }
    },

  // Edit Category
    getUpdate :  async (req, res) => {
        try {
            const vehicleId = req.params.vehicleId;
            const user = req.user;
        
            if (!user) {
              return res.redirect('/admin/auth/login');
            }
            console.log("Fetching Vehicle with ID:", vehicleId);
        
            // Find the deliveryman in the database by ID
            const vehicle = await models.BranchModel.Vehicle.findById(vehicleId)
                .populate('deliveryman_id')
                .populate('branch_id');
        
            if (!vehicle) {
              // Vehicle not found in the database
              throw new Error('Vehicle not found.');
            }
        
            // Send the deliveryman details to the client for updating
            res.render('admin/Vehicle/update', { Title: "Vehicle Update",user, vehicle , error:"Update the deliveryMan" }); // Assuming you are using a template engine like EJS
          } catch (err) {
            console.log("There is an issue while fetching the Delivery Man for updating.");
            console.log(err.message);
            res.status(404).send(err.message);
          }
    },

  // Update Category
    postUpdate :  async (req, res) => {
        try {
            const vehicleId = req.params.vehicleId;
            console.log("Updating Vehicle with ID:", vehicleId);
        
            const {vehicle_number, branch_id, deliveryman_id} = req.body;
        
            // Find the Delivery Man in the database by ID
            const vehicle = await models.BranchModel.Vehicle.findById(vehicleId);
        
            if (!vehicle) {
              // Delivery Man not found in the database
              throw new Error('Delivery Man not found.');
            }
        
                vehicle.vehicle_number = vehicle_number;
                vehicle.branch_id = branch_id;
                vehicle.deliveryman_id = deliveryman_id;
        
            // Save the updated Delivery Man to the database
            await vehicle.save();
            console.log("Vehicle updated successfully");
        
            res.redirect('/admin/vehicle/list?success="Delivery Man Updated Successfully"');
          } catch (err) {
            console.log("There is an issue while updating the Delivery Man details.");
            console.log(err.message);
            res.status(400).send(err.message);
          }
    },
};

