const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require('jsonwebtoken')
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
const AddOn = require('../../models/products/add_on.js')


// Importing Routes
router.get('/lists', authenticateToken, async (req, res) => {
  try {
    const addon = await AddOn.find({});
    const addonLength = addon.length;
    const user = req.user;

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

router.get('/add', authenticateToken, async (req, res) => {
  try {
    const addon = await AddOn.find({});
    const user = req.user;

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

// Add Addon 
router.post('/add', authenticateToken, async (req, res) => {
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

// update Addon
router.get('/update/:addOnId', authenticateToken, async (req, res) => {
  try {
    const addOnId = req.params.addOnId;
    const user = req.user;

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

router.post('/update/:addonId', authenticateToken, async (req, res) => {
  try {
    const addonId = req.params.addonId;
    console.log("Updating addon with ID:", addonId);

    // Find the Addon in the database by ID
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
    console.log("There is an issue while updating the Addon.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});



// DELETE request to delete a Addon by its ID
router.delete('/delete/:addonId', authenticateToken, async (req, res) => {
  try {
    const addonId = req.params.addonId;

    // Find and delete the -Addon in the database by ID
    const deletedAddon = await AddOn.findByIdAndDelete(addonId);

    if (!deletedAddon) {
      throw new Error('Addon not found.');
    }

    console.log("Addon Deleted successfully");
    res.status(200).send("Addon Deleted successfully");
  } catch (err) {
    console.log("There is an issue while deleting the Addon.");
    console.log(err.message);
    res.status(400).send(err.message);
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

module.exports = router