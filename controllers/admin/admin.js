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
const options = { day: '2-digit', month: 'short', year: 'numeric' };

const route = {
  baseUrL : "http://localhost:3000/",
};


// Models
const User = require('../../models/users/user.js');
const Order = require('../../models/products/order.js');
const Product = require('../../models/branch/product.js');
const AddOn = require('../../models/products/add_on.js');


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

      const orderInfo = await Order.find();
      const all = orderInfo.length;

      const pending =  orderInfo.filter(order => order.status ==="Pending");
      const pendingOrder = pending.length;

      const confirmed = orderInfo.filter(order => order.status ==="Confirmed");
      const confirmedOrder = confirmed.length;

      const processing =  orderInfo.filter(order => order.status ==="Processing");
      const processingOrder = processing.length;

      const out =  orderInfo.filter(order => order.status ==="Out for delivery");
      const outOrder = out.length;

      const delivered =  orderInfo.filter(order => order.status ==="Delivered");
      const deliveredOrder = delivered.length;

      const returned =  orderInfo.filter(order => order.status ==="Returned");
      const returnedOrder = returned.length;

      const failed =  orderInfo.filter(order => order.status ==="Failed");
      const failedOrder = failed.length;

      const cancelled =  orderInfo.filter(order => order.status ==="Cancelled");
      const cancelledOrder = cancelled.length;

      const scheduled =  orderInfo.filter(order => order.status ==="Scheduled");
      const scheduledOrder = scheduled.length;


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
      all:all,
      pending:pendingOrder,
      confirmed:confirmedOrder,
      processing:processingOrder,
      out:outOrder,
      delivered:deliveredOrder,
      returned:returnedOrder,
      failed:failedOrder,
      cancelled:cancelledOrder,
      scheduled:scheduledOrder,

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
  const orderInfo = await Order.find();
  const allOrders = orderInfo.length;

  const products = await Product.find();
  const allProducts = products.length;

  const users = await User.find({usertype: "Customer"});
  const allCustomers = users.length;

  const addOn = await AddOn.find();

  const orderDetail = await Order.aggregate([
    {
      $match: {
        status: "Delivered",
        payment_status: true
      }
    },
    {
      $unwind: "$product_items" // Unwind the product_items array
    },
    {
      $group: {
        _id: "$product_items.product_id",
        totalRevenue: { $sum: "$grand_total" },
        totalQuantity: { $sum: "$product_items.quantity" }
      }
    }
  ]);
  
        // Now you can access product quantities dynamically
        const totalRevenue = orderDetail.length > 0 ? orderDetail[0].totalRevenue : 0;
        const totalQuantity = orderDetail.length > 0 ? orderDetail[0].totalQuantity : 0;
  
      const productQuantities = {};


      // Populate the productQuantities object
      orderDetail.forEach((productDetail) => {
        const productId = productDetail._id;
        const totalQuantitySold = productDetail.totalQuantity;
        
        // Assign variables dynamically based on product IDs
        productQuantities[productId] = totalQuantitySold;
      });

      // Access product quantities dynamically
      for (const productId in productQuantities) {
        console.log(`Total Quantity Sold for Product ${productId}: ${productQuantities[productId]}`);
      }
      

      console.log("Total Revenue for Delivered Orders with Payment Status True: " + totalRevenue);

        // Transform the data into arrays for charting
    const productIds = orderDetail.map(item => item.totalRevenue);
    const quantities = orderDetail.map(item => item.totalQuantity);


  error = "You are successfully logged in"
  res.render('admin/dashboard', { options ,allOrders, allProducts, totalRevenue, totalQuantity, allCustomers , products, addOn ,user: user, error ,route : route.baseUrL,productQuantities , productQuantities: JSON.stringify({ productIds, quantities })})
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
  
