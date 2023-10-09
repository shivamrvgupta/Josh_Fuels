//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const path = require("path");
const toastr = require('toastr');
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
app.use('/image', express.static(path.join(__dirname, 'uploads')));


// Models
const DeliveryMan = require('../../models/users/deliveryman.js');
const Branch = require('../../models/branch/profile.js')
const Vehicle = require('../../models/branch/vehicle.js')

// Importing Routes
router.get('/add',authenticateToken, async (req, res) => {
  try{
    const user = req.user;
    if(!user){
      return res.redirect('/admin/auth/login');
    }

    const branch = await Branch.find({});
    const deliveryman = await DeliveryMan.find({});

    res.render('branch/vehicle/add', {Title: "Add Vehicle", user, branch, deliveryman, route: route.baseUrl, error: "Add Vehicle"});
  }catch(err){
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/getDeliveryman', authenticateToken, async (req, res) => {
  try {
      const branchId = req.query.branch_id;
      const deliveryman = await DeliveryMan.find({ parent_id: branchId });
      res.json(deliveryman);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/add', authenticateToken, async (req, res) => {
  try {
    const {vehicle_number, branch_id, deliveryman_id} = req.body;
    console.log(req.name)
    const user = req.user;
    if(!user){
      return res.redirect('/admin/auth/login');
    }
    
    const vehicle = new Vehicle({
      vehicle_number,
      branch_id,
      deliveryman_id
    })

    await vehicle.save();
    res.redirect('/admin/vehicle/list');

  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/list', authenticateToken, async (req, res) => {
    try {
        const vehicle = await Vehicle.find({}).populate('branch_id').populate('deliveryman_id');
        const vehicleCount = vehicle.length;
        const user = req.user;
        if (!user) {
            return res.redirect('/admin/auth/login');
        }
        res.render('branch/vehicle/list', { Title: "Vehicle list", user, vehicleCount, vehicle , route : route.baseUrL, error: "List of Vehicle" })
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/update/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const vehicleId = req.params.vehicleId;
    const user = req.user;
    const branch = await Branch.find({});

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching Vehicle with ID:", vehicleId);

    // Find the Vehicle in the database by ID
    const vehicle = await DeliveryMan.findById(vehicleId).populate('branch_id').populate('deliveryman_id');

    if (!vehicle) {
      // Vehicle not found in the database
      throw new Error('Vehicle not found.');
    }

    // Send the deliveryman details to the client for updating
    res.render('branch/vehicle/update', { Title: "Vehicle Update",user, branch, vehicle , route : route.baseUrL, error:"Update the Vehicle" }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the Vehicle for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/update/:vehicleId', upload.fields([
  { name: 'id_image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
  { name: 'deliveryman_image', maxCount: 1 }, // maxCount: 1 indicates only one image will be uploaded
]), authenticateToken, async (req, res) => {
  try {
    const deliverymanId = req.params.deliverymanId;
    console.log("Updating Delivery Man with ID:", deliverymanId);

    const { fname, lname, email, phone, branch, identity_type, identity_number, password } = req.body;

    // Find the Delivery Man in the database by ID
    const deliveryman = await DeliveryMan.findById(deliverymanId);

    if (!deliveryman) {
      // Delivery Man not found in the database
      throw new Error('Delivery Man not found.');
    }

    // Check if 'id_image' field is found in the request
    if (req.files && req.files['id_image']) {
      if (deliveryman.id_image) {
        deleteImageFile(deliveryman.id_image);
      }
      deliveryman.id_image = req.files['id_image'][0].filename;
    }

    // Check if 'banner_image' field is found in the request
    if (req.files && req.files['deliveryman_image']) {
      if (deliveryman.deliveryman_image) {
        deleteImageFile(deliveryman.deliveryman_image);
      }
      deliveryman.deliveryman_image = req.files['deliveryman_image'][0].filename;
    }

    deliveryman.fname = fname;
    deliveryman.lname = lname;
    deliveryman.phone = phone;
    deliveryman.email = email;
    deliveryman.branch = branch;
    deliveryman.identity_type= identity_type;
    deliveryman.identity_number= identity_number ;
    deliveryman.password = password;
    // deliveryman.id_image = id_image;
    // deliveryman.deliveryman_image= deliveryman_image ;

    // Save the updated Delivery Man to the database
    await deliveryman.save();
    console.log("Delivery Man updated successfully");

    res.redirect('/admin/deliveryman/list?success="Delivery Man Updated Successfully"');
  } catch (err) {
    console.log("There is an issue while updating the Delivery Man details.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

// DELETE request to delete a Delivery Man by its ID
router.delete('/delete/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const deliverymanId = req.params.deliverymanId;
    console.log("Deleting Delivery Man with ID:", deliverymanId);

    // Find and delete the Delivery Man from the database
    const deletedDeliveryman = await DeliveryMan.findOneAndDelete({ _id: deliverymanId});

    if (!deletedDeliveryman) {
      // Category not found in the database
      throw new Error('Delivery Man not found.');
    }

    // Delete the image files associated with the Deliveryman (if applicable)
    if (deletedDeliveryman.id_image) {
      deleteImageFile(deletedDeliveryman.id_image);
    }

    if (deletedDeliveryman.deliveryman_image) {
      deleteImageFile(deletedDeliveryman.deliveryman_image);
    }

    console.log("Delivery Man deleted successfully");

    res.status(200).json({ message: 'Delivery Man deleted successfully' });
  } catch (err) {
    console.log("There is an issue while deleting the Delivery Man.");
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

module.exports = router ;
  