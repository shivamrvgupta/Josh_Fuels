//jshint esversion:6
require("dotenv").config();
const express = require("express");
const app = express();
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

app.use(cookieParser());
app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60 * 60 * 1000, // Session will expire after 1 hour of inactivity
  }
}));



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


// Importing Routes

const admin_routes = require('./controllers/admin/admin.js')
const store_routes = require('./controllers/branch/branch.js')
const category_route = require('./controllers/admin/category.js')
const attribute_route = require('./controllers/admin/attributes.js')
const addon_route = require('./controllers/admin/addon.js')
const product_route = require('./controllers/admin/product.js')
const banner_route = require('./controllers/admin/banner.js')
const branch_route = require('./controllers/admin/branch.js')
const deliveryMan_route = require('./controllers/admin/deliveryman.js')
const customer_route = require('./api/customer.js')
const update_profile = require('./api/update_profile.js')
const address = require('./api/address.js')
const customer = require('./controllers/admin/customer.js')
const order = require('./controllers/branch/order.js')

//customer api route
app.use('/customer/auth',customer_route)

// Admin Login and Dashboard routes
app.use('/admin', admin_routes)

// Store Login and Dashboard routes
app.use('/branch', store_routes)

// Category routes
app.use('/admin/category', category_route)

// Attribute routes
app.use('/admin/attribute', attribute_route)

// Add-On routes
app.use('/admin/addon', addon_route)

// Products routes
app.use('/admin/product', product_route)

// Banner routes
app.use('/admin/banner', banner_route)

// Branch routes
app.use('/admin/branch', branch_route)

// DeliveryMan routes
app.use('/admin/deliveryman', deliveryMan_route)

// update_profile
app.use('/user/update_profile', update_profile)

// Address routes
app.use('/user/address', address)

// Customer route
app.use('/admin/customer', customer)

//Orders Route
app.use('/admin/orders', order)


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});



