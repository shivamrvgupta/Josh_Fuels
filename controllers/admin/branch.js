//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt")
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose");
const os = require('os');
const fs = require('fs');

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
const Branch = require('../../models/branch/profile.js');


// Importing Routes

router.get('/all', authenticateToken, async (req, res) => {
  try {
    const branch = await Branch.find({});
    const branchCount = branch.length;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/branch/lists', { Title: "All Branches",user, branch, branchCount, route : route.baseUrL, error: "List of Branches"});
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/add', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/branch/add', { Title: "Add new Branch", user, route : route.baseUrL, error:"Add new Branch" });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/add', upload.fields([
  { name: 'branch_image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
]), authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, password, password2, address1, address2, area, pincode, city, state, country } = req.body;
    const imageFilename = req.files['branch_image'] ? req.files['branch_image'][0].filename : null;

    // Check if passwords match
    if (password !== password2) {
      throw new Error('Passwords do not match.');
    }

    if (!name || !imageFilename) {
      throw new Error('Required fields are missing.');
    }

    const branchData = {
      token: uuidv4(),
      name,
      phone,
      email,
      password: await bcrypt.hash("1234@user", 10),
      branch_image: imageFilename,
      address1,
      address2,                                         
      area,
      pincode,
      city,
      state,
      country,

    };

    
    // Check if the phone number exists in the database
    const existingBranchByPhone = await Branch.findOne({ phone: branchData.phone });
    if (existingBranchByPhone) {
      console.log('Phone number is already used');
      return res.redirect('/admin/branch/add')
    }
    console.log('Phone number succeeded');

    // Check if the email already exists in the database
    const existingUserByEmail = await Branch.findOne({ email: branchData.email });
    if (existingUserByEmail) {
      console.log('Email is already used');
      return res.redirect('/admin/branch/add')
    }
    console.log('Email succeeded');


    // Create a new user if all checks pass

    console.log('All Check Passed');
    const newBranch = new Branch(branchData);
    await newBranch.save();
    console.log("Branch Added successfully");
    res.redirect('/admin/branch/all');
  } catch (err) {
    console.log("There is an issue please check once again");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

router.post('/update-status', authenticateToken, async (req, res) => {
  const branchId = req.body.branchId;
  console.log(branchId)
  try {
    // Find the branch in the database by ID
    const branch = await Branch.findById(branchId);

    if (!branch) {
      // Branch not found in the database
      return res.status(404).send('Branch not found');
    }

    // Toggle the status (true to false or false to true) and save the updated branch
    branch.status = !branch.status;
    await branch.save();
    
    console.log('Database value updated successfully');
    res.json({ status: branch.status }); // Respond with the updated status
  } catch (err) {
    console.error('Error updating database value: ', err);
    res.status(500).send('Error updating database value');
  }
});


router.get('/update/:branchId', authenticateToken, async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching branch with ID:", branchId);

    // Find the branch in the database by ID
    const branch = await Branch.findById(branchId);

    if (!branch) {
      // branch not found in the database
      throw new Error('Branch not found.');
    }

    // Send the category details to the client for updating
    res.render('admin/branch/update', { branch, user,route: route.baseUrL, error : "Update the Branch"}); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the branch for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/update/:branchId', upload.fields([
  { name: 'branch_image', maxCount: 1 },       
]), authenticateToken, async (req, res) => {
  try {
    const branchId = req.params.branchId;
    console.log("Updating branch with ID:", branchId);

    const { name, phone, email, address1 , address2, area , pincode, city, state, country} = req.body;

    // Find the branch in the database by ID
    const branch = await Branch.findById(branchId);

    if (!branch) {
      // branch not found in the database
      throw new Error('Branch not found.');
    }

    // Check if 'image' field is found in the request
    if (req.files && req.files['branch_image']) {
      if (branch.branch_image) {
        deleteImageFile(branch.branch_image);
      }
      branch.branch_image = req.files['branch_image'][0].filename;
    }


    branch.name = name;
    branch.phone = phone;
    branch.email = email;
    branch.address1 = address1;
    branch.address2 = address2;
    branch.area = area;
    branch.pincode = pincode;
    branch.city = city;
    branch.state = state;
    branch.country = country;

    // Save the updated branch to the database
    await branch.save();
    console.log("Branch updated successfully");

    res.redirect('/admin/branch/all?success="Branch Updated Successfully"');
  } catch (err) {
    console.log("There is an issue while updating the Branch.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});



// DELETE request to delete a category by its ID
router.delete('/delete/:branchId', authenticateToken, async (req, res) => {
  try {
    const branchId = req.params.branchId;
    console.log("Deleting branch with ID:", branchId);

    // Find and delete the branch from the database
    const deletedBranch = await Branch.findOneAndDelete({ _id: branchId });

    if (!deletedBranch) {
      // Branch not found in the database
      throw new Error('Branch not found.');
    }

    // Delete the image files associated with the Branch (if applicable)
    if (deletedBranch.branch_image) {
      deleteImageFile(deletedBranch.branch_image);
    }

    if (deletedBranch.banner_image) {
      deleteImageFile(deletedBranch.banner_image);
    }

    console.log("Branch deleted successfully");

    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.log("There is an issue while deleting the Branch.");
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