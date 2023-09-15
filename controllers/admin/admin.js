//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const toastr = require('toastr');
const bcrypt = require("bcrypt")
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

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


// Importing Routes
router.get('/auth/login', async (req, res)=> {
  res.render('a-login',{title: "admin" , redirect : "branch" ,route : route.baseUrL, error: "Welcome to Login"})
})
  
// Handle the login
router.post('/auth/login', async (req, res) => {
  const { email, password, remember } = req.body;
  try {

      // Find the user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.redirect(`/admin/auth/login?error=User Not Found ${encodeURIComponent(email)}`);
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
       // Create a JWT token
      const payload = {
      userId: user._id, 
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      usertype: user.usertype,


    };
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' });

   
      //  Set the token as a cookie or in the response body, depending on your preference
        if (remember) {
          res.cookie('jwt',  token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true }); 
        } else {
          res.cookie('jwt', token, { httpOnly: true });
        }
        res.return = token;
      return res.redirect('/admin/auth/dashboard');
  } catch (error) {
      console.error('Login error:', error);
      return res.status(500).send('An error occurred. Please try again later.');
  }
});

router.get('/auth/dashboard', authenticateToken , async (req, res) => {
  const user = req.user;
  
  error = "You are successfully logged in"
  res.render('admin/dashboard', {user: user , error ,route : route.baseUrL})
}); 

  
function authenticateToken(req, res, next) {
  const token = req.cookies.jwt;
  
  if (!token) {
    return res.redirect('/admin/auth/login'); 
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.redirect('/admin/auth/login');
    }
    console.log(token)
    req.user = user; 
    next(); 
  });
}

// Handle the logout request
router.get('/auth/logout', (req, res) => {
  try {
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


module.exports = router ;
  
