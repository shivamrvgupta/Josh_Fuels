//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
// const session = require('express-session')
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
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// app.use(
//   session({
//     secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
//     resave: true,
//     saveUninitialized: true,
//     cookie: {
//       maxAge: 60 * 60 * 1000, // Session will expire after 1 hour of inactivity
//     },
//   })
// );

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
// const { Cookie } = require("express-session");


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

       // Create a JWT token
    const payload = {
      userId: user._id, 
      email: user.email,
      userType: user.usertype,
    };
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

   
      //  Set the token as a cookie or in the response body, depending on your preference
        if (remember) {
          res.cookie('jwt',  token, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }); 
        } else {
          res.cookie('jwt', token, { httpOnly: true });
        }
        res.return = token;
       console.log(token)
      return res.redirect('/admin/auth/dashboard');
  } catch (error) {
      console.error('Login error:', error);
      return res.status(500).send('An error occurred. Please try again later.');
  }
});

router.get('/auth/dashboard', authenticateToken , async (req, res) => {

  const user = req.user;
 
  error = "You are successfully logged in"
  res.render('admin/dashboard', {user : user , error ,route : route.baseUrL})
}); 

  
function authenticateToken(req, res, next) {
  console.log("authenticating token")

  console.log(req.headers)
  const token = req.headers.cookies.jwt;
  
  console.log(req.headers)
  if (!token) {
    console.log("no token found")
    return res.redirect('/admin/auth/login'); // No token provided, redirect to login page
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.redirect('/admin/auth/login'); // Token verification failed, redirect to login page
    }
    console.log("token authenticated")
    req.user = user; // Store the user object in the request for later use
    next(); // Authentication successful, continue to the next middleware or route
  });
}


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


module.exports = router ;

<div class="mb-4 row align-items-center">
<label class="col-sm-3 col-form-labrl form-label-title">Branch</label>
<div class="col-sm-9">
    <select class="js-example-basic-single w-100" name="branch">
        <option disabled>--- Select Any One ---</option>
            <% if (branch != '') { %>        
                 <% branch.forEach((row, index) => { %> 
                 <option value="<%= row.id %>"> <%= row.name %></option>
            <% }) %>      
            <% } else { %>
                 <option disabled>Nothing To Show</option>
            <% } %>
    </select>
</div>
</div>
  
