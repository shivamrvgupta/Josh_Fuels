//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose");
const os = require('os');

const app = express();

// Routes APP
const finalRoute = {
  baseUrl: "http://127.0.0.1/",
};

const hostname = os.hostname();

let route;

if (hostname === process.env.localhost1 || hostname === process.env.localhost ) {
  // If the hostname is localhost or 127.0.0.1, use a different route
  route = `${localhost}:${PORT}/`;
} else if (hostname === process.env.ipAddress || hostname === process.env.ipAddress2 || hostname === process.env.ipAddress3 ) {
  // If the hostname matches the specific IP address, use another route
  route = `http://${ipAddress}:${PORT}/`;
} else {
  // If it's not localhost or the specific IP, use the default route
  route = finalRoute.baseUrl;
}

app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("../public"));


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
  
  
// Models
const Customer = require('../../models/users/user.js');
const Address = require('../../models/users/address.js')
const Order = require('../../models/products/order.js');


if (hostname === process.env.localhost1 || hostname === process.env.localhost ) {
  // If the hostname is localhost or 127.0.0.1, use a different route
  route = `${localhost}:${PORT}/`;
} else if (hostname === process.env.ipAddress) {
  // If the hostname matches the specific IP address, use another route
  route = `http://${ipAddress}:${PORT}/`;
} else {
  // If it's not localhost or the specific IP, use the default route
  route = finalRoute.baseUrl;
}



// Importing Routes
router.get('/list',authenticateToken, async (req, res) => {
    try {
      const user = req.user;

      if(!user){
        return res.redirect('/admin/auth/login');
      }
  
      // Filter customers with user_type = "customer"
      const customers = await Customer.find({ usertype: "Customer" });
      const customerCount = customers.length;
  
      res.render('admin/customer/lists', {
        Title: "All Customers",
        user,
        customers,
        customerCount,
        route: route.baseUrL,
        error: "List of cutomers"
      });
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  });

//Get the Customer page
router.get('/add', authenticateToken,  async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/customer/add', {user, route : finalRoute.baseUrL, error:"Add a Customer" });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

//Add a Customer
router.post('/add', authenticateToken, upload.fields([
  { name: 'customer_image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
]), async (req, res) => {
  try{
    const { first_name,last_name, email, phone, company} = req.body;
    const imageFilename = req.files['customer_image'] ? req.files['customer_image'][0].filename : null;

    if (!first_name || !last_name || !email || !phone || !company) {
      throw new Error('Required fields are missing.');
    }

    const customer = new Customer({
      first_name,
      last_name,
      email,
      phone,
      company,
      usertype: "Customer",
      profile: imageFilename,
    })


    await customer.save();
    console.log("Customer added successfully");
    res.redirect('/admin/customer/list');

  }catch(err){
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/detail/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching customer with ID:", customerId);

    // Find the customer in the database by ID
    const customer = await Customer.findById(customerId);
    const address = await Address.findOne({user_id: customerId})
    if (!customer) {
      // customer not found in the database
      throw new Error('Customer not found.');
    }

    res.render('admin/customer/details', { customer, address, user, route: route.baseUrL, error: " Update Customer" }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the customer for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
})

router.get('/update/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching customer with ID:", customerId);

    // Find the customer in the database by ID
    const customer = await Customer.findById(customerId);
    const address = await Address.findOne({user_id: customerId});
    console.log(address);
    if (!customer) {
      // customer not found in the database
      throw new Error('Customer not found.');
    }

    res.render('admin/customer/update', {address, customer, user,route: route.baseUrL, error: " Update Customer" }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the customer for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/update/:customerId',authenticateToken, upload.fields([
  { name: 'customer_image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
]), async (req, res) => {
  try {
    const customerId = req.params.customerId;
    console.log("Updating customer with ID:", customerId);

    const { first_name, last_name, phone, email, company, address1, address2 , area, pincode, city, state, country} = req.body;

    // Find the customer in the database by ID
    const customer = await Customer.findById(customerId);
    const address = await Address.findOne({user_id: customerId});
    console.log(address);
    if (!customer) {
      // customer not found in the database
      if(!address){
        throw new Error("Address not found")
      }
      throw new Error('Customer not found.');
    }

    // Check if 'image' field is found in the request
    if (req.files && req.files['customer_image']) {
      if(customer.profile){
      deleteImageFile(customer.profile);
      }
      customer.profile = req.files['customer_image'][0].filename;
    }

    customer.first_name = first_name;
    customer.last_name = last_name
    customer.phone = phone;
    customer.email = email;
    customer.company = company;
    address.address_1 = address1;
    address.address_2 = address2;
    address.area = area;
    address.pincode = pincode;
    address.city = city;
    address.state = state;
    address.country = country;

    // Save the updated customer to the database
    await customer.save();
    await address.save();
    console.log("Customer updated successfully");

    res.redirect('/admin/customer/list');
  } catch (err) {
    console.log("There is an issue while updating the Customer.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

// DELETE request to delete a Customer by its ID
router.delete('/delete/:customerId',authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;
    console.log("Deleting customer with ID:", customerId);

    // Find and delete the customer from the database
    const deletedCustomer = await Customer.findOneAndDelete({ _id: customerId });

    if (!deletedCustomer) {
      // customer not found in the database
      throw new Error('Customer not found.');
    }

    // Delete the image files associated with the customer (if applicable)
    if (deletedCustomer.image) {
      deleteImageFile(deletedCustomer.image);
    }

    if (deletedCustomer.banner_image) {
      deleteImageFile(deletedCustomer.banner_image);
    }

    console.log("Customer deleted successfully");

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.log("There is an issue while deleting the Customer.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

function deleteImageFile(filename) {
  const imagePath = path.join(__dirname, 'uploads', filename);

  if (fs.existsSync(imagePath)) {
    try {
      fs.unlinkSync(imagePath);
      console.log('Image file deleted successfully:', imagePath);
    } catch (err) {
      console.error('Error while deleting image file:', err.message);
    }
  } else {
    console.warn('Image file not found:', imagePath);
  }
}

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

module.exports = router