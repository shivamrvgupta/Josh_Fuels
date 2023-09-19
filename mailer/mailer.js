const nodemailer = require('nodemailer');
const nodemailerTransporter = require('./nodemailer-transport');
const models = require('../api/customer/models');


// Function to send OTP verification email
module.exports = {
  sendOTPVerificationEmail : async (email) => {
    try {
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      console.log(otp)
      const mailOptions = {
        from: process.env.AuthEmail,
        to: email,
        subject: 'OTP Verification',
        html: `<h1>OTP Verification</h1><p>Your OTP is ${otp}</p>`,
      };

      // Save OTP data to the database
      const otpData = new models.Otp({ phone: email, otp });
      await otpData.save();

      // Send the OTP email
      await nodemailerTransporter.sendMail(mailOptions);

      console.log('OTP email sent successfully');
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw error;
    }
  }

}