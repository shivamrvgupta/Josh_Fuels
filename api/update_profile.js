const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer')
const session = require('express-session');
const path = require("path");
const bcrypt = require("bcrypt")
const fs = require('fs');

const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(session({
  secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
  resave: false,
  saveUninitialized: true,
  cookie:{
    maxAge: 60 * 60 * 1000, // Session will expire after 1 hour of inactivity
  }
}));


// Add your Google Geolocation API key here
const GOOGLE_GEOLOCATION_API_KEY = 'AIzaSyDZpyPwSTv5XLNdOLZlZa2Tc1EUWj7PZJQ';
const GOOGLE_MAPS_API_KEY = 'AIzaSyDZpyPwSTv5XLNdOLZlZa2Tc1EUWj7PZJQ';

// Function to generate a 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
  }
  
  // Function to simulate sending OTP (you can replace this with actual OTP sending logic)
  function sendOTPToUser(phone, otp) {
    console.log(`OTP for ${phone}: ${otp}`);
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



//send OTP to change the password
router.post('/phone/send-otp', async (req, res) => {
  const phone_number = req.body.phone;
  
  
  try {
    const user = req.session.user;
    console.log(user);
    if (!user) {
      return res.status(401).json({ status: false, status_code: 401, message: 'Please log in first', data: {} });
    }
    
    // Check if the mobile number exists in the database
    const userExists = await User.findOne({ phone: phone_number });

    if (!userExists) {
      const otp = generateOTP();
      sendOTPToUser(phone_number, otp);
      return res.status(402).json({ status: false, status_code: 500, message: 'User Not Found', data: {} });
    }

    req.session.user_id = userExists._id;

    // Generate and send OTP
    const otp = generateOTP();
    sendOTPToUser(phone_number, otp);

    // Store the generated OTP in the session for verification
    req.session.otp = otp;
    req.session.phone_number = phone_number;

    // Redirect to OTP verification page
    return res.status(200).json({ status: true, status_code: 200, message: 'OTP sent successfully', data: {text: 'Your OTP:', otp } });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ status: false, status_code: 500, message: 'Internal Server Error', data: {} });
  }
});

// Verify OTP
  router.post('/phone/verify-otp', async (req, res) => {
    const data = {
      phone_number: req.body.phone,
      otp: req.body.otp
    };
    const storedOTP = req.session.otp;
    const p_number = req.session.phone_number;
  
    try {
      if (storedOTP == data.otp ) {

        // OTP is correct, check if the user's address is confirmed or not
        const user = await User.findOne({ phone: p_number });
        
        user.phone = data.phone_number;
        user.save();
        // Mobile confirmed, log the user in (you can implement login logic here) and redirect to the dashboard
        return res.status(200).json({ status: true, status_code: 200, message: 'Mobile Number has been Updated Successfully', data: { updatedPhone: user.phone }});
      } else {

        // Invalid OTP, redirect back to OTP verification page with an error message
        return res.status(400).json({ status: false, status_code: 400, message: 'Invalid OTP', data: {} });
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      return res.status(500).json({ status: false, status_code: 500, message: 'Internal Server Error', data: {} });
    }
});

// Send OTP to change the Email 
router.post('/email/send-otp', async (req, res) => {
  const email_id = req.body.email;

  try {
    const user_session = req.session.user;
    if (!user_session) {
      return res.status(401).json({ status: false, status_code: 401, message: 'Please log in first', data: {} });
    }
    // Check if the mobile number exists in the database
    const userExists = await User.findOne({ email: email_id });

    if (!userExists) {
      const otp = generateOTP();
      sendOTPToUser(email_id, otp);
      return res.status(402).json({ status: false, status_code: 500, message: 'User Not Found', data: {} });
    }

    req.session.user_id = userExists._id;
    // Generate and send OTP
    const otp = generateOTP();
    sendOTPToUser(email_id, otp);

    // Store the generated OTP in the session for verification
    req.session.otp = otp;
    req.session.email_id = email_id;

    // Redirect to OTP verification page
    return res.status(200).json({ status: true, status_code: 200, message: 'OTP sent successfully', data: {text: 'Your OTP:', otp } });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ status: false, status_code: 500, message: 'Internal Server Error', data: {} });
  }
});

//verify OTP and Update the email
router.post('/email/verify-otp', async (req, res) => {
  const data = {
    email_id: req.body.email,
    otp: req.body.otp
  };
  const storedOTP = req.session.otp;
  const e_mail = req.session.email_id;

  try {
    if (storedOTP == data.otp ) {

      // OTP is correct, check if the user's address is confirmed or not
      const user = await User.findOne({ email: e_mail });
      
      user.email = data.email_id;
      user.save();
      // Email confirmed, log the user in (you can implement login logic here) and redirect to the dashboard
      return res.status(200).json({ status: true, status_code: 200, message: 'Email id has been Updated Successfully', data: { updatedemail: user.email }});
    } else {

      // Invalid OTP, redirect back to OTP verification page with an error message
      return res.status(400).json({ status: false, status_code: 400, message: 'Invalid OTP', data: {} });
    }
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(500).json({ status: false, status_code: 500, message: 'Internal Server Error', data: {} });
  }
});



module.exports = router;
