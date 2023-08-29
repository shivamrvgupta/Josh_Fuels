//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const session = require('express-session')
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt")

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
const Branch = require('../../models/branch/profile.js');


// Importing Routes

router.get('/auth/login', async (req, res)=> {
    res.render('a-login',{ title: "branch" , redirect : "admin", route : route.baseUrL, error: "Welcome to Branch Login"});
})
  
// Handle the login form submission
router.post('/auth/login', async (req, res) => {
  const { email, password, remember } = req.body;

  try {
      // Find the user by email
      const user = await Branch.findOne({ email });

      if (!user) {
        return res.redirect(`/branch/auth/login?error=User Not Found${encodeURIComponent(email)}`);
      }

      // Compare the provided password with the hashed password stored in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.redirect(`/branch/auth/login?error=Invalid email or password&email=${encodeURIComponent(email)}`);
      }

      // Check if the user's usertype is "branch"
      if (user.usertype !== 'Branch') {
          return res.redirect('/branch/auth/login?error=You do not have permission to access the branch panel.');
      }

      // Set user session
      req.session.user = user;

      // If "Remember Me" is checked, extend the session duration to 7 days
      if (remember) {
          req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      }

      return res.redirect('/branch/auth/dashboard');
  } catch (error) {
      console.error('Login error:', error);
      return res.status(500).send('An error occurred. Please try again later.');
  }
});

// Handle the logout request

router.get('/auth/dashboard', async (req, res) => {
  if (!req.session.user) {
      return res.redirect('/branch/auth/login');
  }

  // Access the user's data from the session
  const user = req.session.user;
  error = "You are successfully logged in"
  res.render('branch/dashboard', {user : user , error ,route : route.baseUrL})
});
  
  

module.exports = router ;
  
