//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const session = require('express-session')
const bodyParser = require("body-parser");
const path = require("path");
const toastr = require('toastr');
const bcrypt = require("bcrypt")
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(
  session({
    secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 60 * 60 * 1000, // Session will expire after 1 hour of inactivity
    },
  })
);

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


const route = {
  baseUrL : "http://localhost:3000/",
};


// Models
const User = require('../../models/users/user.js');
const Product = require('../../models/products/product.js')


// Importing Routes

router.get('/auth/login', async (req, res)=> {
  res.render('a-login',{title: "admin" , redirect : "branch" ,route : route.baseUrL, error: "Welcome to Login"})
})
  
// Handle the login form submission
router.post('/auth/login', async (req, res) => {
  const { email, password, remember } = req.body;

  try {
      // Find the user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.redirect(`/admin/auth/login?error=User Not Found${encodeURIComponent(email)}`);
      }

      // Compare the provided password with the hashed password stored in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.redirect(`/admin/auth/login?error=Invalid email or password&email=${encodeURIComponent(email)}`);
      }

      // Check if the user's usertype is "admin"
      if (user.usertype !== 'Admin') {
          return res.redirect('/admin/auth/login?error=You do not have permission to access the admin panel.');
      }

      // Set user session
      req.session.user = user;

      // If "Remember Me" is checked, extend the session duration to 7 days
      if (remember) {
          req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      }

      return res.redirect('/admin/auth/dashboard');
  } catch (error) {
      console.error('Login error:', error);
      return res.status(500).send('An error occurred. Please try again later.');
  }
});

// Handle the logout request
router.get('/auth/logout', (req, res) => {
  try {
    console.log("Clicked Logout")
    // Clear the user session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      // Redirect the user to the login page after logging out
      res.redirect('/admin/auth/login');
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).send('An error occurred during logout.');
  }
});

router.get('/auth/dashboard', async (req, res) => {
  try {
    const user = req.session.user;
    const product = await Product.find({});
    const productCount = product.length;

    if (!user) {
        return res.redirect('/admin/auth/login');
    }
    // Access the user's data from the session
    error = "You are successfully logged in"
    res.render('admin/dashboard', {user, product, productCount ,error ,route : route.baseUrL})  
  } catch (error) {
    
  }
  
});
  

module.exports = router ;
  
