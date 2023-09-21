//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const toastr = require('toastr');
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

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
const Customer = require('../../models/users/user.js');
const Order = require('../../models/products/order.js')


//Routes
router.get("/all", authenticateToken, async (req,res) => {
  try{
    const user = req.user;

    if(!user){
      return res.redirect('/admin/auth/login')
    }
  const orders = await Order
  .find()
  .populate('user_id')
  .populate('branch_id')
  .populate('address_id')
  .populate('address_id')

  const customers = await Customer.find({ usertype: "Customer" });
  const ordersCount = orders.length;

  res.render("branch/order/all", {user, ordersCount, customers, orders, options, route : route.baseUrL , error: "List of Orders"});
  }catch(err){
    console.log(err);
    res.status(500).send('Internal Server Error');
  }

})

router.get('/details/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate('product_items').populate('branch_id').populate('address_id').populate('user_id');
    const user = req.user;
    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('branch/order/detail', { user,order,  route : route.baseUrL,options , error:"order Detail"});
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});



function authenticateToken(req, res, next) {
  const token = req.cookies.jwt;
  console.log(token)
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


module.exports = router;