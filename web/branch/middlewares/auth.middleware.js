const jwt = require('jsonwebtoken');
const models = require('../../../managers/models');
const express = require("express");
const cookieParser = require('cookie-parser');
secretKey = process.env.SECRET_KEY
const app = express();



// This is a set of revoked tokens. In production, this should be a database table.

module.exports = {  

  authenticateToken:async (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) {
      console.log("Token is not verified")
      return res.redirect('/admin/auth/login'); 
    }

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.redirect('/admin/auth/login');
      }
      req.user = user; 
      next(); 
    })
  },
  
  generateAccessToken: (user) => {
    const userObject = {
      userId: user._id, // Replace with the actual user ID property
      name : user.name,
      usertype : user.usertype,
      email : user.email,
      phone : user.phone,
      profile : user.image,
      city : user.city
    };
    return jwt.sign(userObject , secretKey, { expiresIn: '4h' });
  },
};
