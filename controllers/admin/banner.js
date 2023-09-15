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
const User = require('../../models/users/user.js')
const Device = require('../../models/users/device.js')
const Address = require('../../models/users/address.js')
const AddOn = require('../../models/products/add_on.js')
const Attribute = require('../../models/products/attribute.js')
const Banner = require('../../models/products/banner.js')  
const Category = require('../../models/products/category.js')
const Sub_Category = require('../../models/products/sub-category.js')
const Product = require('../../models/products/product.js')


//Routes
router.get('/list', authenticateToken, async (req, res) => {
    try {
      const banner = await Banner.find({});
      const bannerCount = banner.length;
      const user = req.user;
  
      if (!user) {
        return res.redirect('/admin/auth/login');
      }
      res.render('admin/banner/list', { Title: "All Banner",user, banner, bannerCount, route : route.baseUrL, error: "List of Banners" });
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  });


router.get('/add', authenticateToken, async (req, res) => {
    try {
      
      const product = await Product.find({});
      const user = req.user;
  
      if (!user) {
        return res.redirect('/admin/auth/login');
      }
      res.render('admin/banner/add', { Title: "Add new Banner",user,product, route : route.baseUrL, error: "Add new Banner" });
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  });



  router.post('/add', upload.fields([
    { name: 'banner_image', maxCount: 1 }, // maxCount: 1 indicates only one image will be uploaded
  ]), authenticateToken, async (req, res) => {
    try {
      const { title, product } = req.body; 
  const bannerImageFilename = req.files['banner_image'] ? req.files['banner_image'][0].filename : null;

  if (!title || !product || !bannerImageFilename) {
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!product) missingFields.push('product');
    if (!bannerImageFilename) missingFields.push('banner_image');

    // Create an error message indicating the missing fields
    const errorMessage = `Required field(s) are missing: ${missingFields.join(', ')}`;
    throw new Error(errorMessage);
  }

      const bannerData = {
        token: uuidv4(),
        title,
        product,
        image: bannerImageFilename,
      };
  
      const newBanner = new Banner(bannerData);
      await newBanner.save();
      console.log("Banner added successfully");
      res.redirect('/admin/banner/list');
    } catch (err) {
      console.log("There is an issue please check once again");
      console.log(err.message);
      res.status(400).send(err.message);
    }
  });

  
  router.post('/update-status', authenticateToken, async (req, res) => {
    const bannerId = req.body.bannerId;
    console.log(bannerId)
    try {
      // Find the Banner in the database by ID
      const banner = await Banner.findById(bannerId);
  
      if (!banner) {
        // Banner not found in the database
        return res.status(404).send('Banner not found');
      }
  
      // Toggle the status (true to false or false to true) and save the updated Banner
      banner.status = !banner.status;
      await banner.save();
      
      console.log('Database value updated successfully');
      res.json({ status: banner.status }); // Respond with the updated status
    } catch (err) {
      console.error('Error updating database value: ', err);
      res.status(500).send('Error updating database value');
    }
  });
  
  router.get('/update/:bannerId', authenticateToken, async (req, res) => {
    try {
      const bannerId = req.params.bannerId;
      const user = req.user;
      if (!user) {
        return res.redirect('/admin/auth/login');
      }
      console.log("Fetching banner with ID:", bannerId);  
      
      // Find the banner in the database by ID
      const banner = await Banner.findById(bannerId);
      
      if (!banner) {
        // Banner not found in the database
        throw new Error('Banner not found.');
      }
      
      // Send the banner details to the client for updating
      res.render('admin/banner/update-banner', { banner, user,route: route.baseUrL , error: "Update the Banner"});

    } catch (err) {
      console.log("There is an issue while fetching the banner for updating.");
      console.log(err.message);
      res.status(404).send(err.message);
    }
  });
  
  router.post('/update/:bannerId', upload.fields([
    { name: 'banner_image', maxCount: 1 }, // maxCount: 1 indicates only one image will be uploaded
  ]), authenticateToken, async (req, res) => {
    try {
      const bannerId = req.params.bannerId;
      console.log("Updating banner with ID:", bannerId);
  
      // Find the banner in the database by ID

      const banner = await Banner.findById(bannerId);
      console.log("I am here");
      
      if (!banner) {
        // Banner not found in the database
        console.log("I am here");
        throw new Error('Banner not found.');
      }
      
      // Update the fields if they are provided in the request
      if (req.body.title) {
        banner.title = req.body.title;
        console.log("I am here");
      }
      
      
      // Check if 'banner_image' field is found in the request
      if (req.files && req.files['banner_image']) {
        
        console.log("I am here");
        // Delete the existing image
        if (banner.image) {
          deleteImageFile(banner.image);
        }

        banner.image = req.files['banner_image'][0].filename;


      }
  
      // Save the updated banner to the database
      const updatedBanner = await banner.save();
      console.log("Banner updated successfully");
  
      res.redirect('/admin/banner/list');
    } catch (err) {
      console.log("There is an issue while updating the banner.");
      console.log(err.message);
      res.status(400).send(err.message);
    }
  });
  
  // DELETE request to delete a banner by its ID
  router.delete('/delete/:bannerId', authenticateToken, async (req, res) => {
    try {
      const bannerId = req.params.bannerId;
      console.log("Deleting banner with ID:", bannerId);
  
      // Find and delete the banner from the database
      const deletedBanner = await Banner.findOneAndDelete({ _id: bannerId });
  
      if (!deletedBanner) {
        // Banner not found in the database
        throw new Error('Banner not found.');
      }
  
      // Delete the image files associated with the banner (if applicable)
      if (deletedBanner.image) {
        deleteImageFile(deletedBanner.image);
      }
  
      if (deletedBanner.banner_image) {
        deleteImageFile(deletedBanner.banner_image);
      }
  
      console.log("Banner deleted successfully");
  
      res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (err) {
      console.log("There is an issue while deleting the banner.");
      console.log(err.message);
      res.status(400).send(err.message);
    }
  });
  
  
  
  function deleteImageFile(filename) {
    const imagePath = path.join(__dirname, '../../uploads', filename);
  
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