const nodemailer = require('nodemailer');

// Create and configure a Nodemailer transporter instance
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_SMTP_HOST,
    port: process.env.MAIL_SMTP_PORT,
    secure: process.env.MAIL_SMTP_SECURE === 'true', // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_SMTP_USER,
      pass: process.env.MAIL_SMTP_PASS,
    },
  });
};

module.exports = {
  getInstance: createTransporter,
};
