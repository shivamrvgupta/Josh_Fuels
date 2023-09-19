const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../../../mailer')
const {
  MessageConstants,
  StatusCodesConstants,
  ParamsConstants,
  
} = require('../constants');
const { AuthMiddleware } = require('../middlewares');
const { Validator, ApiError } = require('../utils');
const User = require('../models/user'); // Import your User model
const { AuthHelper, OtpHelper } = require('../helpers');
const secretKey = process.env.SECRET_KEY
const {
  JwtService,
  UserService,
} = require('../services');
const { generateAccessToken, initializeRevokedTokens } = require('../middlewares/auth.middleware');
const models = require('../models');

// This would be your token blacklist storage
const tokenBlacklist = new Set();



module.exports = {
// User Login API
  login : async (req, res) => {
    const loginData = {
      phone_number: req.body.phone,
    };

    const validationResult = Validator.validate(loginData, {
      phone_number: {
          presence: { allowEmpty: false },
          numericality: { onlyInteger: true },
          length: { minimum: 10,  maximum: 10 }
      }
    });
    if (validationResult) {
      return res.status(StatusCodesConstants.BAD_REQUEST).json({
        status: false,
        status_code: StatusCodesConstants.BAD_REQUEST,
        message: MessageConstants.VALIDATION_ERROR,
        data: validationResult, // Include the validation result in the response if needed
      });
    }

    try {
      // Check if the mobile number exists in the database
      const userExists = await models.UserModel.User.findOne({ phone: loginData.phone_number });

      if (!userExists) {
        const otp = OtpHelper.generateOTP();
        OtpHelper.sendOTPToUser(loginData.phone_number, otp);
        const otpData = new models.UserModel.Otp({ phone : loginData.phone_number, otp : otp})
        const result = await otpData.save();
        return res.status(StatusCodesConstants.SUCCESS).json({
          status: true,
          status_code: StatusCodesConstants.SUCCESS,
          message: 'User Not Found, Please register first.',
          data: {phone_number : loginData.phone_number,  otp }
        });
      }

      // Generate and send OTP
      const otp = OtpHelper.generateOTP();
      OtpHelper.sendOTPToUser(loginData.phone_number, otp);
      const otpData = new models.UserModel.Otp({ phone : loginData.phone_number, otp : otp})
      const result = await otpData.save();
      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: 'User Found and OTP sent successfully',
        data: {phone_number : loginData.phone_number,  otp}
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ status: false, status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR, message: MessageConstants.INTERNAL_SERVER_ERROR, data: {} });
    }
  },

// Verify OTP API
  verifyOTP : async (req, res) => {
    const verifyData = {
      phone_number: req.body.phone,
      otp : Number(req.body.otp)
    };

    const validationResult = Validator.validate(verifyData, {
      phone_number: {
          presence: { allowEmpty: false },
          numericality: { onlyInteger: true },
          length: { minimum: 10,  maximum: 10 }
      },
      otp: {
        presence: { allowEmpty: false },
      },
    });
    if (validationResult) {
      return res.status(StatusCodesConstants.BAD_REQUEST).json({
        status: false,
        status_code: StatusCodesConstants.BAD_REQUEST,
        message: MessageConstants.VALIDATION_ERROR,
        data: validationResult, // Include the validation result in the response if needed
      });
    }


    try {
      // Fetch the secret key from the environment variables
      console.log("Verifying Otp ------")
      console.log("Verifying phone ------", verifyData.phone_number)
      console.log("Verifying Otp ------", typeof verifyData.otp)

      // Verify the JWT token
      const otpHolder = await models.UserModel.Otp.find({
        phone : verifyData.phone_number
      })
      console.log("Verifying otpHolder ------", otpHolder)

      if(otpHolder.length === 0){
        return res.status(StatusCodesConstants.BAD_REQUEST).json(
          { status: false, status_code: StatusCodesConstants.BAD_REQUEST, message: 'You entered an Expired OTP!'});
      }

      const decoded = otpHolder[otpHolder.length - 1];

      console.log(decoded)
      console.log(decoded.phone)
      console.log(decoded.phone === verifyData.phone_number)
      console.log(Number(decoded.otp))
      console.log(Number(decoded.otp) === verifyData.otp)
      
      // Check if the phone number and OTP match the decoded values
      if (decoded.phone === verifyData.phone_number && Number(decoded.otp) === verifyData.otp) {
        // OTP is correct, check if the user's address is confirmed or not
        const user = await models.UserModel.User.findOne({ phone: verifyData.phone_number });

        if (!user) {
          // Phone number not found, redirect the user to the registration page
          return res.status(StatusCodesConstants.SUCCESS).json({ status: true, status_code: StatusCodesConstants.SUCCESS, message: 'Mobile Number verified Successfully, Please Register first', data: {} });
          // Alternatively, you can redirect the user using a redirect URL
          // res.redirect('/register');
        }
        const responseData = {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone,
        };

        const isAddressConfirmed = await models.UserModel.User.checkIfAddressConfirmed(verifyData.phone_number);
        if (!isAddressConfirmed) {
          const token = AuthMiddleware.generateAccessToken(user)
          console.log("Token ---- ",token)
          return res.status(StatusCodesConstants.SUCCESS).json({ status: true, status_code: StatusCodesConstants.SUCCESS, message: 'Address Not Confirmed', data: { responseData, token} });
        }
        // Address confirmed, log the user in (you can implement login logic here) and redirect to the dashboard

        const token = AuthMiddleware.generateAccessToken(user)
        console.log("Token ---- ",token)
        return res.status(StatusCodesConstants.SUCCESS).json({ status: true, status_code: StatusCodesConstants.SUCCESS, message: 'User Found Successfully', data: { responseData , token} });
      } else {
        // Invalid OTP, return an error message
        return res.status(StatusCodesConstants.BAD_REQUEST).json({ status: false, status_code: StatusCodesConstants.BAD_REQUEST, message: 'Invalid OTP', data: {} });
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ status: false, status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR, message: MessageConstants.INTERNAL_SERVER_ERROR, data: {} });
    }
  },

// Register API
  register : async (req, res) => {
    try {
      const userData = {
        token: uuidv4(),
        profile: 'images/user/default_profile.png',
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        dob: req.body.dob,
        email: req.body.email,
        gender: req.body.gender,
        is_active: true,
        is_mobile_verified: true,
        password: await bcrypt.hash('1234@user', 10),
        phone: req.body.phone,
        company: req.body.company,
        usertype: 'Customer',
        accept_term: req.body.accept_term,
      };


      const validationResult = Validator.validate(userData, {
        first_name: {
          presence: { allowEmpty: false },
          length: { minimum: 3, maximum: 20 },
        },
        last_name: {
          presence: { allowEmpty: false },
          length: { minimum: 3, maximum: 20 },
        },
        company: {
          presence: { allowEmpty: false },
          length: { minimum: 3, maximum: 100 },
        },
        accept_term: {
          presence: { allowEmpty: false },
        },
        email: {
          presence: { allowEmpty: false },
          email: true,
        },
        phone:{
          presence: { allowEmpty: false },
          numericality: { onlyInteger: true },
          length: { minimum: 10, maximum: 10 },
        },
      })

      if (validationResult) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: MessageConstants.VALIDATION_ERROR,
          data: validationResult, // Include the validation result in the response if needed
        });
      }

      const existingUserByEmail = await models.UserModel.User.findOne({ email: userData.email });
      if (existingUserByEmail) {
        return res.status(StatusCodesConstants.SUCCESS).json({
          status: false,
          status_code: StatusCodesConstants.RESOURCE_EXISTS,
          message: 'Email Already Used',
          data: null,
        });
      }

      const newUser = new models.UserModel.User(userData);
      const savedUser = await newUser.save();


      const responseData = {
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        email: savedUser.email,
        phone_number: savedUser.phone,
      };

      const newToken = AuthMiddleware.generateAccessToken(savedUser)

      const verifyToken = AuthMiddleware.verifyAccessToken(newToken)
      console.log(verifyToken)


      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: 'User registered successfully',
        data: { user: responseData, token: newToken },
      });
    } catch (error) {
      console.error(error);
      return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
        status: false,
        status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
        message: MessageConstants.INTERNAL_SERVER_ERROR,
      });
    }
  },

// Add Device Data
  addDevice : async (req, res) => {
    try {
      const user = req.user;
      user_id = user.userId;
      if(!user_id){
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: 'Please Login First',
        })
      }
      
      const addDevice = {
        user_id: user_id,
        token: uuidv4(),
        name: req.body.name,
        type: req.body.type,
        version : req.body.version 
      }

      const validationResult = Validator.validate(addDevice, {
        name: {
          presence: { allowEmpty: false },
          length: { minimum: 4, maximum: 50 },
        },
        type: {
          presence: { allowEmpty: false },
          length: { minimum: 3, maximum: 50 },
        },
        version: {
          presence: { allowEmpty: false },
          length: { maximum: 50 },
        },
      })

      if (validationResult) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: MessageConstants.VALIDATION_ERROR,
          data: validationResult, // Include the validation result in the response if needed
        });
      }

      const newDevice = new models.UserModel.Device(addDevice);
      const savedDevice = await newDevice.save();

      console.log(savedDevice)

      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: 'Device added successfully',
        data: { device: savedDevice },
      });
      }
      catch (error) {
        console.error(error);
        return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
          status: false,
          status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
          message: MessageConstants.INTERNAL_SERVER_ERROR,
        });
      }
  },

// Get User Data
  getUser : async (req, res) => {
    try {
      const session = req.user;
      user_id = session.userId;
      if(!user_id){
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: 'Please Login First',
        })
      }

      // Fetch the full data of user
      const user = await models.UserModel.User.findOne({ _id : user_id });
      if (!user) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: 'User Not Found',
        });
      }

      // Fetch device data associated with the user_id from the found user
      const devices = await models.UserModel.Device.find({ user_id: user_id });

      // Fetch address data associated with the user_id from the found user
      const addresses = await models.UserModel.Address.find({ user_id: user_id });

      // Check if there are any addresses
      const address = addresses[0];

      // Combine the fetched data into a single response
      const data = {
        user,
        devices,
        address,
      };

      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: 'User data fetched successfully',
        data : data,
      });

    }
    catch (error) {
      console.error(error);
      return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
        status: false,
        status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
        message: MessageConstants.INTERNAL_SERVER_ERROR,
      });
    }
  },

  // Email Verification
  sendotp:  async (req, res) => {
    try {
      const { email } = req.body;
      await emailService.sendOTPVerificationEmail(email); // Use the function from the mailer module
  
      res.status(StatusCodesConstants.SUCCESS).json({ message: 'OTP email sent successfully' });
    } catch (error) {
      res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ message: 'Something went wrong' });
    }
  },

  logout:(req, res) => {
    const session = req.user;
    const user_id = session.userId;
    const user_token = req.token ;
  
    if (user_token) {
      // Add the token to the revokedTokens set to invalidate it
      initializeRevokedTokens(user_id, user_token);

      console.log(initializeRevokedTokens)
  
      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        message: MessageConstants.USER_LOGGED_OUT,
      });
    } else {
      return res.status(StatusCodesConstants.ACCESS_DENIED).json({
        status: false,
        message: MessageConstants.ACCESS_DENIED_ERROR,
      });
    }
  }

}

