const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app= express();
app.use(session({
    secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
    resave:false,
    saveUninitialized:true,
}));



// Middleware to handle form data and file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + '-' + Date.now() + path.extname(file.originalname)
      );
    },
  });
  
  const upload = multer({ storage: storage });

//model
const User = require('../models/users/user.js')
const Address = require('../models/users/address.js')


//API to add address
router.post('/add-address', async (req, res) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).json({ status: false, status_code: 401, message: 'Please log in first', data: {} });
    }

    // Check if the user with the provided user_id exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ status: false, status_code: 404, message: 'User not found', data: {} });
    }

    const newAddress = req.body; // Assuming you provide the new address data in the request body
    newAddress.user_id = user_id; // Set the user_id for the new address

    // Create a new Address instance using the Address model
    const address = new Address(newAddress);

    await address.save();

    res.status(201).json({
      status: true,
      status_code: 201,
      message: 'Address added successfully',
      data: { address }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      status_code: 500,
      message: 'Internal server error',
      data: {}
    });
  }
});

// API to fetch all addresses
router.get('/list', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) {
      return res.status(401).json({ status: false, status_code: 401, message: 'Please log in first', data: {} });
    }

    // Check if the user with the provided user_id exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ status: false, status_code: 404, message: 'User not found', data: {} });
    }
    
    const addresses = await Address.find({ user_id });

    res.status(200).json({
      status: true,
      status_code: 200,
      message: 'Successfully fetched addresses',
      data: {
        addresses,
        addressCount: addresses.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      status_code: 500,
      message: 'Internal server error',
      data: {}
    });
  }
});


// API to update an address for the logged-in user
router.put('/update/:addressId', async (req, res) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).json({ status: false, status_code: 401, message: 'Please log in first', data: {} });
    }

    // Check if the user with the provided user_id exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ status: false, status_code: 404, message: 'User not found', data: {} });
    }

    const addressId = req.params.addressId;
    const updatedAddress = req.body; // Assuming you provide the updated address data in the request body

    // Find the address by addressId and user_id
    const address = await Address.findOne({ _id: addressId, user_id });

    if (!address) {
      return res.status(404).json({ status: false, status_code: 404, message: 'Address not found', data: {} });
    }

    // Update the address fields
    address.address_type = updatedAddress.address_type;
    address.address_1 = updatedAddress.address_1;
    address.address_2 = updatedAddress.address_2;
    address.area = updatedAddress.area;
    address.city = updatedAddress.city;
    address.pincode = updatedAddress.pincode;
    address.state = updatedAddress.state;

    await address.save();

    res.status(200).json({
      status: true,
      status_code: 200,
      message: 'Address updated successfully',
      data: { updatedAddress }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      status_code: 500,
      message: 'Internal server error',
      data: {}
    });
  }
});


// API to delete an address for the logged-in user
router.delete('/delete/:addressId', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) {
      return res.status(401).json({ status: false, status_code: 401, message: 'Please log in first', data: {} });
    }

    // Check if the user with the provided user_id exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ status: false, status_code: 404, message: 'User not found', data: {} });
    }

   
    const addressId = req.params.addressId;

    // Delete the address
    const deletedAddress = await Address.deleteOne({ _id: addressId, user_id });

    if (deletedAddress.deletedCount === 0) {
      return res.status(404).json({ status: false, status_code: 404, message: 'Address not found', data: {} });
    }

    res.status(200).json({
      status: true,
      status_code: 200,
      message: 'Address deleted successfully',
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      status_code: 500,
      message: 'Internal server error',
      data: {}
    });
  }
});


module.exports = router;