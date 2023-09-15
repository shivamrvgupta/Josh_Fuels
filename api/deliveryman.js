const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const session = require('express-session');
const path = require("path");
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require('uuid');


const app = express();
app.use(session({
  secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000  } //session will expire in 1 hour of inactivity
}))


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


// Import the user model
const User = require('../models/users/user.js');


//Delivery Man Login
app.post('/delivery/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({status:false, status_code: 202, message : 'Email and password are required'})
    }
  
    // Find the user with the provided email
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ status:false, status_code: 202, message : 'User not Found'})
      }
  
      // Verify the provided password with the stored password hash
      const isPasswordMatch = await user.comparePassword(password);
  
  
      if (!isPasswordMatch) {
        return res.status(401).json({ status: false, status_code:401,  message: 'Invalid password' });
      }
  
      // Password matches, login successful
      res.status(200).json({ status: true, status_code: 200, message: 'Login successful', data: user });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ status: false, status_code: 500, message: 'Internal server error' });
    }
  });

  module.exports = router;