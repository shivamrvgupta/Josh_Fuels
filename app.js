//jshint esversion:6
require("dotenv").config();
const express = require("express");
const app = express();
const multer = require("multer");
const session = require('express-session')
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt")
const mongoose = require("mongoose");


app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(
  session({
    secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789!@#$%^&*()',
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
  
  app.use('/image', express.static(path.join(__dirname, 'uploads')));
  
// Connecting Mongoose\
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser : true,
  useUnifiedTopology: true
})

const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', ()=> console.log('Connected to the database!'));

// Models

const User = require('./models/users/user.js')
const Device = require('./models/users/device.js')
const Address = require('./models/users/address.js')


// // // Importing Routes

  // // Apis
  const customer_routes = require("./api/customer.js");
  const branch_api = require("./api/branch.js");


    // Customer Crud Api route
    app.use('/customer', customer_routes)


    // Branch 
    app.use('/branch', branch_api)   


  // // Admin's
  const category_route = require('./controllers/admin/category.js')
  const addon_route = require('./controllers/admin/addon.js')
  const product_route = require('./controllers/admin/product.js')
  const branch_route = require('./controllers/admin/branch.js')
  const admin_routes = require('./controllers/admin/admin.js')
  const admin_customer_routes = require('./controllers/admin/customer.js')


    // Admin Login and Dashboard routes
    app.use('/admin', admin_routes)

    // Category routes
    app.use('/admin/category', category_route)

    // Add-On routes
    app.use('/admin/addon', addon_route)

    // Products routes
    app.use('/admin/product', product_route)

    // Branch routes
    app.use('/admin/branch', branch_route)
    
    // Admin Customers routes
    app.use('/admin/customer', admin_customer_routes)



  // // Branches
  const store_routes = require('./controllers/branch/branch.js')
  const catalogue_routes = require('./controllers/branch/catalogue.js')
  const products_routes = require('./controllers/branch/product.js')

    // Store Login and Dashboard routes
    app.use('/branch', store_routes)

    // Products Catalogue 
    app.use('/branch/catalogue', catalogue_routes)

    // Branch Products
    app.use('/branch/product', products_routes)



app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
