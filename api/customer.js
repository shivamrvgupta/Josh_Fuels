const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer')
const session = require('express-session');
const path = require("path");
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
app.use(session({
  secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
  resave: false,
  saveUninitialized: true,
  cookie: {
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
function sendOTPToUser(phone_number, otp) {
  console.log(`OTP for ${phone_number}: ${otp}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Models

const User = require('../models/users/user.js')
const Device = require('../models/users/device.js')
const Address = require('../models/users/address.js');


// User Login Api for Customer and DeliveryMan


// Route to register a new user and store the latitude and longitude in the database
router.post('/register', upload.single('profile'), async (req, res) => {
  const userData = {
    token : uuidv4(),
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    dob: req.body.dob,
    email: req.body.email,
    gender: req.body.gender,
    is_active: req.body.is_active,
    password: await bcrypt.hash("1234@user", 10),
    phone: req.session.phone_number,
    company : req.body.company,
    profile: req.file ? req.file.filename : null,
    usertype: 'Customer',
    accept_term : req.body.accept_term

  };

  try {
      
    const requiredFields = [
      'first_name',
      'last_name',
      'dob',
      'email',
      'gender',
      'is_active',
      'company',
      'phone',  
    ];
    const missingFields = [];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    // Check if any fields are missing
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        status_code: 202,
        message: 'Please enter this empty fields',
        data: missingFields,
      });
    }

    // Check if the phone number exists in the database
    const existingUserByPhone = await User.findOne({ phone: userData.phone });
    if (existingUserByPhone) {
      return res.status(400).json({
        status: false,
        status_code: 202,
        message: 'Phone Number Already Used',
        data: null,
      });
    }
    console.log('Phone number succeeded');

    // Check if the email already exists in the database
    const existingUserByEmail = await User.findOne({ email: userData.email });
    if (existingUserByEmail) {
      return res.status(400).json({
        status: false,
        status_code: 202,
        message: 'Email Already Used',
        data: null,
      });
    }
    console.log('Email succeeded');


    // Create a new user if all checks pass

    console.log('All Check Passed');
    const newUser = new User(userData);
    req.session.user_id = newUser._id

    console.log(newUser._id)
    const savedUser = await newUser.save();
    console.log(savedUser);

    return res.status(200).json({
      status: true,
      status_code: 200,
      message: 'User registered successfully',
      data: savedUser, // Use savedUser here, which includes the generated _id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      status_code: 500,
      message: 'Internal server error',
    });
  }
});

// Route to handle login form submission
router.post('/login', async (req, res) => {
  const phone_number = req.body.phone;

  try {
    const user = await User.findOne({ phone: phone_number });

    if (!user) {
      // Handle user not found
      return res.status(202).json({ status: false, message: 'User Not Found' });
    }

    // Assuming the user exists, set session data
    req.session.user = user;
    // Generate and send OTP
    const otp = generateOTP();
    sendOTPToUser(phone_number, otp);

    // Store the generated OTP in the session for verification
    req.session.otp = otp;
    req.session.phone_number = phone_number;

    return res.status(200).json({ status: true, status_code: 200, message: 'OTP sent successfully', data: {text: 'Your OTP:', otp } });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ status: false, message: 'Internal Server Error' });
  }
});


// Route to send OTP to the user
router.post('/send-otp', async (req, res) => {
  const phone_number = req.body.phone;

  try {
    const userExists = await User.findOne({ phone: phone_number });

    if (userExists) {
      const otp = generateOTP();
      sendOTPToUser(phone_number, otp);

      // Store the generated OTP in the session for verification
      req.session.otp = otp;
      req.session.phone_number = phone_number;

      res.json({ status: 'success', status_code: 200, message: 'OTP sent successfully.', data: { text: 'Your OTP:', otp } });
    } else {
      const otp = generateOTP();
      sendOTPToUser(phone_number, otp);

      // Store the generated OTP in the session for verification
      req.session.otp = otp;
      req.session.phone_number = phone_number;
      res.json({ status: 'error', status_code: 400, message: 'Please register first.', data: otp });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ status: 'error', status_code: 500, message: 'Internal Server Error', data: {} });
  }
});

// Route to verify OTP to the user
router.post('/verify-otp', async (req, res) => {
  const data = {
    phone_number: req.body.phone,
    otp: req.body.otp
  };
  const storedOTP = req.session.otp;
  try {
    if (storedOTP == data.otp && req.session.phone_number == data.phone_number) {
      // OTP is correct, check if the user's address is confirmed or not
      req.session.phone_number = data.phone_number;

      const user = await User.findOne({ phone: data.phone_number });

      if (!user) {
        // Phone number not found, redirect the user to the registration page
        return res.status(200).json({ status: true, status_code: 200, message: 'Mobile Number verified Successfully', data: {} });
        // Alternatively, you can redirect the user using a redirect URL
        // res.redirect('/register');
      }
      const isAddressConfirmed = await User.checkIfAddressConfirmed(data.phone_number);
      if (!isAddressConfirmed) {
        return res.status(202).json({ status: false, status_code: 500, message: 'Address Not Confirmed', data: {} });
      }
      // Address confirmed, log the user in (you can implement login logic here) and redirect to the dashboard
      return res.status(200).json({ status: true, status_code: 200, message: 'User Found Successfully', data: {} });
    } else {
      // Invalid OTP, redirect back to OTP verification page with an error message
      return res.status(400).json({ status: false, status_code: 400, message: 'Invalid OTP', data: {} });
    }
  } catch (error) {
    console.error('Error during OTP verification:', error);
    return res.status(500).json({ status: false, status_code: 500, message: 'Internal Server Error', data: {} });
  }
});

// Route to handle address
router.post('/add-address', async (req, res) => {
  const user_id = req.session.user_id; // Accessing user_id from the session

  const userAddress = {
    user_id: user_id,
    address_type: req.body.type,
    address_1: req.body.address_1,
    address_2: req.body.address_2,
    area: req.body.area,
    city: req.body.city,
    pincode: req.body.pincode,
    state: req.body.state,
    country: req.body.country,
  };

  try {
    console.log(userAddress);
    const response = await axios.post(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_GEOLOCATION_API_KEY}`
    );

    const { location } = response.data;
    const { lat, lng } = location;

    // Add latitude and longitude to the user address data
    userAddress.coordinates = {
      latitude: lat,
      longitude: lng,
    };

    // Reverse geocode to get the address from the latitude and longitude
    const reverseGeocodeResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );

    // Extract the formatted address and other location details from the response
    const addressData = reverseGeocodeResponse.data.results[0];

    // Add the formatted address and other location details to the user address data
    userAddress.address_1 = addressData.formatted_address;
    userAddress.area = addressData.address_components.find((component) =>
      component.types.includes('sublocality_level_1')
    )?.long_name;
    userAddress.city = addressData.address_components.find((component) =>
      component.types.includes('locality')
    )?.long_name;
    userAddress.state = addressData.address_components.find((component) =>
      component.types.includes('administrative_area_level_1')
    )?.long_name;
    userAddress.country = addressData.address_components.find((component) =>
      component.types.includes('country')
    )?.long_name;
    userAddress.pincode = addressData.address_components.find((component) =>
      component.types.includes('postal_code')
    )?.long_name;

    // Create a new user address if all checks pass
    const newAddress = new Address(userAddress); // Use the Address model
    const savedAddress = await newAddress.save();

    // Update the user's is_address_available field to true
    await User.findByIdAndUpdate(user_id, { is_address_available: true });


    return res.status(200).json({
      status: true,
      status_code: 200,
      message: 'Address saved successfully',
      data: savedAddress,
    });
  } catch (error) {
    console.error('Error fetching geolocation:', error.message);
    return res.status(500).json({
      status: false,
      status_code: 500,
      message: 'Error fetching geolocation',
    });
  }
});

//route to adda device
router.post('/add-device', async( req, res) => {
  const user_id = req.session.user_id; // Accessing user_id from the session
  const deviceData = {
    user_id : user_id,
    name: req.body.name,  
    type: req.body.type,
    version : req.body.version,
  }

  try {

    const requiredFields = [
      'name',
      'type',
      'version'
    ];
    const missingFields = [];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    // Check if any fields are missing
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        status_code: 400,
        message: 'Please enter this empty fields',
        data: missingFields,
      });
    }

    const newDevice = new Device(deviceData);
    await newDevice.save();

    return res.status(200).json({
      status: true,
      status_code: 200,
      message: 'Device data stored successfully',
      data: newDevice,
    });
  } catch (error) {
    console.error('Error storing device data:', error);
    return res.status(500).json({
      status: false,
      status_code: 500,
      message: 'Error storing device data:',
    });
  }
});


//GET route for fetching all data based on token and user_id
router.get('/userdata/:token', async (req, res) => {
  try {
    const user_id = req.session.user_id; // Accessing user_id from the session
    const { token } = req.params;

    // Fetch user based on the provided token
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch device data associated with the user_id from the found user
    const devices = await Device.find({ user_id: user._id });

    // Fetch address data associated with the user_id from the found user
    const addresses = await Address.find({ user_id: user._id });

    // Combine the fetched data into a single response
    const data = {
      user,
      devices,
      addresses,
    };

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Route to delete a user
router.delete('/delete/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Find the user by ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ status: false, status_code: 404, message: 'User not found' });
      }
  
      // Delete the user
      await User.deleteOne({ _id: userId });
  
      res.status(200).json({ status: true, status_code: 200, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error during user deletion:', error);
      res.status(500).json({ status: false, status_code: 500, message: 'Internal server error' });
    }
  });


// Update Profile Route
router.put('/update/profile/:userId', async (req, res) => {
  try {
    const loggedInUser = req.session.user;

    if (!loggedInUser) {
      console.log('User not logged in');
      return res.status(401).json({ status: false, message: 'Please log in first' });
    }

    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ status: false, message: 'User ID is missing in the request' });
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    // Handle profile image update from the request body
    if (req.body.profile) {
      const newProfileImage = req.body.profile;

      // Delete the previous profile image from the database
      if (userToUpdate.profile) {
        try {
          console.log(userToUpdate.profile)
          deleteImageFile(userToUpdate.profile);
        } catch (deleteError) {
          console.error('Error deleting previous profile image:', deleteError);
        }
        userToUpdate.profile = null; // Set the profile field to null to remove the reference to the previous image
      }

      // Set the new profile image
      userToUpdate.profile = newProfileImage;
    } else {
      return res.status(400).json({ status: false, message: 'Profile image is missing in the request body' });
    }

    await userToUpdate.save();
    console.log('Profile updated for user:', userId);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'An error occurred while updating profile' });
  }
});



// Define the deleteImageFile function here
function deleteImageFile(filename) {
  console.log('Deleting image file:', filename); 
  const imagePath = path.join(__dirname, '../uploads', filename);

  if (fs.existsSync(imagePath)) {
    try {
      fs.unlinkSync(imagePath);
      console.log('Image file deleted successfully:', imagePath);
    } catch (err) {
      console.error('Error while deleting image file:', err.message);
    }
  } else {
    console.warn('Image file not found:', imagePath);
  }
}

module.exports = router;


