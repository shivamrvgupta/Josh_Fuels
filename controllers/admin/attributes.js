//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt= require('jsonwebtoken');
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
const Attribute = require('../../models/products/attribute.js')



// Importing Routes
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const attribute = await Attribute.find({});
    const attributeLength = attribute.length;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/attribute/list', {
      Title: "All Attribute",
      error: "List of Attribute",
      user,
      attribute: attribute,
      attributeCount: attributeLength,
      route: route.baseUrL
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/add', authenticateToken, async (req, res) => {
  try {
    const attribute = await Attribute.find({});
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/attribute/add', { Title: "Add new Attribute", user, attribute, error: "Add New Attribute", route : route.baseUrL });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

// Add Attributes 
router.post('/add', authenticateToken, async (req, res) => {
  try {
    console.log("I am here")
    console.log(req.body.name)
    const { name } = req.body;

    if (!name) {
      throw new Error('Required fields are missing.');
    }

    const subData = {
      token: uuidv4(),
      name,
    };

    const newAttribute = new Attribute(subData);
    await newAttribute.save();
    console.log("Sub attribute Added successfully");
    res.redirect('/admin/attribute/list');
  } catch (err) {
    console.log("There is an issue please check once again");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

// Update Attributes
router.get('/update/:attributeId', authenticateToken, async (req, res) => {
  try {
    const attributeId = req.params.attributeId;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching attribute with ID:", attributeId);

    // Find the attribute in the database by ID
    const attribute = await Attribute.findById(attributeId);

    if (!attribute) {
      // attribute not found in the database
      throw new Error('attribute not found.');
    }

    // Send the attribute details to the client for updating
    res.render('admin/attribute/update', { user, attribute,error: "Update the Attribute", route: route.baseUrL }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the attribute for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/update/:attributeId', authenticateToken, async (req, res) => {
  try {
    const attributeId = req.params.attributeId;
    console.log("Updating attribute with ID:", attributeId);

    // Find the attribute in the database by ID
    const attribute = await Attribute.findById(attributeId);

    if (!attribute) {
      // attribute not found in the database
      throw new Error('attribute not found.');
    }

    // Update the fields if they are provided in the request
    if (req.body.name) {
      attribute.name = req.body.name;
    }

    // Save the updated attribute to the database
    const updatedattribute = await attribute.save();
    console.log("attribute updated successfully");

    res.redirect('/admin/attribute/list');
  } catch (err) {
    console.log("There is an issue while updating the attribute.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

// DELETE request to delete a attribute by its ID
router.delete('/delete/:attributeId', authenticateToken, async (req, res) => {
  try {
    const attributeId = req.params.attributeId;

    // Find and delete the -attribute in the database by ID
    const deletedAttribute = await Attribute.findByIdAndDelete(attributeId);

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