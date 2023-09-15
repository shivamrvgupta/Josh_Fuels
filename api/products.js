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
const User = require('../models/users/user.js')
const AddOn = require('../models/products/add_on.js')
const Attribute = require('../models/products/attribute.js')
const Category = require('../models/products/category.js')
const Sub_Category = require('../models/products/sub-category.js')
const Product = require('../models/products/product.js')



// User Login Api for Customer and DeliveryMan


// Route to register a new user and store the latitude and longitude in the database


module.exports = router;


