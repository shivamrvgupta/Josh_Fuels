const jwt = require('jsonwebtoken');
const fs = require('fs'); // Import the 'fs' module for file operations
const bcrypt = require('bcrypt');
const { promisify } = require('util');  
const axios = require('axios'); // Import the axios library
const { v4: uuidv4 } = require('uuid');
const path = require("path"); 
const {
  MessageConstants,
  StatusCodesConstants,
  ParamsConstants,
  
} = require('../constants');
const { AuthMiddleware } = require('../middlewares');
const { Validator } = require('../../../managers/utils');
const { AuthHelper, OtpHelper } = require('../../../managers/helpers');
const secretKey = process.env.SECRET_KEY
const {
  JwtService,
  UserService,
} = require('../../../managers/services');
const { generateAccessToken, initializeRevokedTokens } = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');
const { PushNotification } = require('../../../managers/notifications')
// This would be your token blacklist storage
const tokenBlacklist = new Set();
const { Mailer } = require('../../../mailer')


module.exports = {
// User Login API
  login : async (req, res) => {
    const loginData = {
      phone_number: req.body.phone,
    };

    console.log(req.body);
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
        const apiUrl = `https://module.logonutility.com/smsapi/index?key=2605B0EA308974&campaign=0&routeid=1&type=text&contacts=${loginData.phone_number}&senderid=TYSTST&msg=Welcome%20to%20Run%20for%20Heart%21%20Enter%20the%20OTP%20code%20${otp}%20to%20verify%20your%20account%20and%20get%20started.%20Regards%20The%20Yellow%20Strawberry`;
        console.log()
        const response = await axios.post(apiUrl);

        if (response.status === 200) {
          console.log('OTP sent successfully');
        } else {
            console.error('Failed to send OTP:', response.statusText);
        }
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
      const apiUrl = `https://module.logonutility.com/smsapi/index?key=2605B0EA308974&campaign=0&routeid=1&type=text&contacts=${loginData.phone_number}&senderid=TYSTST&msg=Welcome%20to%20Run%20for%20Heart%21%20Enter%20the%20OTP%20code%20${otp}%20to%20verify%20your%20account%20and%20get%20started.%20Regards%20The%20Yellow%20Strawberry`;
      const response = await axios.post(apiUrl);

      if (response.status === 200) {
        console.log('OTP sent successfully');
      } else {
          console.error('Failed to send OTP:', response.statusText);
      }
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
          profile: user.profile,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone,
          company: user.company,
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
        return res.status(StatusCodesConstants.RESOURCE_EXISTS).json({
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
  sendEmail: async (req, res) => {
    try {
      const session = req.user;
  
      console.log("Request to send email clicked");
      
      if (!session || !session.userId) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: 'Please Login First',
        });
      }
  
      const recipientEmail = session.email;
      const subject = 'Email Verification';
      const token = "hello1234";
      const recipientName = session.first_name +  session.last_name; 
      const templateFilePath = path.join(__dirname, Mailer.verifyEmail);


      console.log(recipientName);

    // Read the email template file
      const emailTemplateContent = await promisify(fs.readFile)(templateFilePath, 'utf8');

      // Replace placeholders in the email template with actual values
      const replacedEmailTemplate = emailTemplateContent
        .replace('{name}', recipientName)
        .replace('{token}', token);
  
  
      // Send the email and wait for it to complete
      const emailResult = await Mailer.sendCustomMail(recipientEmail, subject, replacedEmailTemplate);
  
      // Check the email sending result and then send the HTTP response
      if (emailResult.success) {
        res.status(StatusCodesConstants.SUCCESS).json({ message: 'OTP email sent successfully' });
      } else {
        res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
          status: false,
          status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
          message: 'Failed to send email',
        });
      }
    } catch (error) {
      console.error(error);
      res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
        status: false,
        status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
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
  },

  getProfile : async (req, res) => {
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

      const responseData = {
        profile_img: user.profile,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        email: user.email,
        phone_number: user.phone,
      };

      const message = "Hello User"

      PushNotification.sendPushNotification(user_id, message)

      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: 'User data fetched successfully',
        data : responseData,
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

  updateProfile: async (req, res) => {
    try {
      const session = req.user;
      user_id = session.userId;
      if (!user_id) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: 'Please Login First',
        })
      }
  
      const userData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        phone_number: req.body.phone,
        company: req.body.company,
      };
  
      // Fetch the full data of user
      const user = await models.UserModel.User.findOne({ _id: user_id });
      if (!user) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: 'User Not Found',
        });
      }
  
      user.first_name = userData.first_name || user.first_name;
      user.last_name = userData.last_name || user.last_name;
      user.email = userData.email || user.email;
      user.phone = userData.phone || user.phone;
      user.company = userData.company || user.company;
  
      await user.save();
  
      // Update the session with the new user data
      session.first_name = user.first_name;
      session.last_name = user.last_name;
      session.email = user.email;
      session.phone_number = user.phone;
      session.company = user.company;
  
      const responseData = {
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        email: user.email,
        phone_number: user.phone,
      };
  
      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: 'User data updated successfully',
        data: responseData,
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

  updatePhoto : async (req, res) =>{
    try {
      const session = req.user;
      user_id = session.userId;
      
      const imageFiles = req.files['profile'];

      if (!imageFiles || imageFiles.length === 0) {
        throw new Error("Image file is missing");
      }
      const imageFilename = imageFiles[0].filename;
      console.log('Image Filename:', imageFilename);

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

      if (req.files && req.files['profile']) {
        // Delete the previous image file before updating with the new one
        if (user.profile) {
          ImgServices.deleteImageFile(user.profile);
        }
        user.profile = req.files['profile'][0].filename;
      }


      await user.save();


      const responseData = {
        profile : user.profile,
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        email: user.email,
        phone_number: user.phone,
      };

      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: 'User data fetched successfully',
        data : responseData,
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
  }
}

