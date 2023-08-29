const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer')
const session = require('express-session');
const path = require("path");
const bcrypt = require("bcrypt")

const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(session({
  secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
  resave: false,
  saveUninitialized: true,
}));

// Add your Google Geolocation API key here
const GOOGLE_GEOLOCATION_API_KEY = 'AIzaSyDZpyPwSTv5XLNdOLZlZa2Tc1EUWj7PZJQ';
const GOOGLE_MAPS_API_KEY = 'AIzaSyDZpyPwSTv5XLNdOLZlZa2Tc1EUWj7PZJQ';



// Function to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Function to simulate sending OTP (you can replace this with actual OTP sending logic)
function sendOTPToUser(phone_number, otp) {
  console.log(`OTP for ${phone_number}: ${otp}`);
}




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

// Models

const Branch = require('../models/branch/profile.js')
const Address = require('../models/users/address.js');
const Product = require('../models/branch/product.js');


// User Login Api for Customer and DeliveryMan

router.get('/nearest-branch', async (req, res) => {
  try {
    const user = req.session.user; // Accessing user_id from the session

    if(!user){
      return res.status(400).json({
        status: false,
        status_code: 400,
        message: 'Please Login First',
        data: null,
      });
    }

    // Fetch user's city based on the sessions user_id
    const user_city = await Address.findOne({ user_id: user._id });

    console.log(user_city.city);

    const branchesInCity = await Branch.find({ city: user_city.city });

    console.log(branchesInCity);

    if (!branchesInCity || branchesInCity.length === 0) {
      return res.status(404).json({ message: 'No branches found in the user city' });
    }

    res.status(200).json(branchesInCity);
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/nearest-branch/products', async (req, res) => {
  try {
    const user = req.session.user; // Accessing user_id from the session

    if (!user) {
      return res.status(400).json({
        status: false,
        status_code: 400,
        message: 'Please Login First',
        data: null,
      });
    }

    // Fetch user's city based on the sessions user_id
    const user_city = await Address.findOne({ user_id: user._id });

    console.log(user_city.city);

    const branchesInCity = await Branch.find({ city: user_city.city });


    if (!branchesInCity || branchesInCity.length === 0) {
      return res.status(404).json({ message: 'No branches found in the user city' });
    }

    console.log("cities found")

    const branchIds = branchesInCity.map(branch => branch._id);

    console.log("This is Branch Ids",branchIds)

    // Fetch products available in the branches of the user's city
    const productsData = await Product.find({ branch_id: branchesInCity._id });

    // Now you have the products available in branches of the user's city
    // You can return these products to the user as a response
    return res.status(200).json({
      status: true,
      status_code: 200,
      message: 'Products fetched successfully',
      data: productsData,
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});





module.exports = router;


