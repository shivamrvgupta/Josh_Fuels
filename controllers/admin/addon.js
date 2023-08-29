//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const session = require('express-session')
const bodyParser = require("body-parser");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("../public"));
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
app.use('/image', express.static(path.join(__dirname, 'uploads')));
  
  
// Models
const AddOn = require('../../models/products/add_on.js')


const route = {
  baseUrL : "http://localhost:3000/",
};


// Importing Routes

// Attribute Part

router.get('/lists', async (req, res) => {
  try {
    const addon = await AddOn.find({});
    const addonLength = addon.length;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login?error = "User Not Found Please Login"');
    }

    res.render('admin/add_on/list', {
      error : "AddOn Lists ",
      Title: "All Add-On",
      user,
      addon: addon,
       addonCount: addonLength,
      route: route.baseUrL
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/add', async (req, res) => {
  try {
    const addon = await AddOn.find({});
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login?error = "User Not Found Please Login"');
    }
    const error = "Add New Add-On"
    res.render('admin/add_on/add', { Title: "Add new AddOn",user, addon, route : route.baseUrL , error });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

// Add Attributes 
router.post('/add', async (req, res) => {
  try {
    console.log("I am here")
    console.log(req.body.name)
    const { name, price } = req.body;

    if (!name || !price ) {
      throw new Error('Required fields are missing.');
    }

    const addonData = {
      token: uuidv4(),
      name,
      price,
    };

    const newAddOn = new AddOn(addonData);
    await newAddOn.save();
    console.log("Sub addon Added successfully");
    res.redirect('/admin/addon/lists?success="New Add-Ons Added Successfully"');
  } catch (err) {
    console.log("There is an issue please check once again");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});


// // Update Attributes
router.get('/update/:addOnId', async (req, res) => {
  try {
    const addOnId = req.params.addOnId;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login?error = "User Not Found Please Login"');
    }
    console.log("Fetching addOn with ID:", addOnId);

    // Find the addOn in the database by ID
    const addOn = await AddOn.findById(addOnId);

    if (!addOn) {
      // addOn not found in the database
      throw new Error('addOn not found.');
    }
    // Send the addOn details to the client for updating
    const error =  "Update Addon";
    res.render('admin/add_on/update', { user, error, addOn, route: route.baseUrL }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the addOn for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/update/:addonId', async (req, res) => {
  try {
    const addonId = req.params.addonId;
    console.log("Updating addon with ID:", addonId);

    // Find the attribute in the database by ID
    const addon = await AddOn.findById(addonId);

    if (!addon) {
      // addon not found in the database
      throw new Error('addon not found.');
    }

    // Update the fields if they are provided in the request
    if (req.body.name || req.body.price) {
      addon.name = req.body.name;
      addon.price = req.body.price;
    }

    // Save the updated addon to the database
    const updatedaddon = await addon.save();
    console.log("Addon updated successfully");

    res.redirect('/admin/addon/lists');
  } catch (err) {
    console.log("There is an issue while updating the attribute.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});



// DELETE request to delete a attribute by its ID
router.delete('/delete/:addonId', async (req, res) => {
  try {
    const addonId = req.params.addonId;

    // Find and delete the -attribute in the database by ID
    const deletedAttribute = await AddOn.findByIdAndDelete(addonId);

    if (!deletedAttribute) {
      throw new Error('Attribute not found.');
    }

    console.log("Attribute Deleted successfully");
    res.status(200).send("Attribute Deleted successfully");
  } catch (err) {
    console.log("There is an issue while deleting the Attribute.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});








module.exports = router