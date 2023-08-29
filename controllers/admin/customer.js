//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const session = require('express-session')
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt")
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
const Customer = require('../../models/users/user.js');


const route = {
  baseUrL : "http://localhost:3000/",
};


// Importing Routes

router.get('/all', async (req, res) => {
    try {
      const user = req.session.user;
  
      if (!user) {
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
        route: route.baseUrL
      });
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  });


// router.get('/add', async (req, res) => {
//   try {
//     const user = req.session.user;

//     if (!user) {
//       return res.redirect('/admin/auth/login');
//     }
//     res.render('admin/customer/add', {user, route : route.baseUrL });
//   } catch (err) {
//     console.log(err);
//     res.status(500).send('Internal Server Error');
//   }
// });


// router.post('/add', upload.fields([
//   { name: 'image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
// ]), async (req, res) => {
//   try {
//     console.log("I am here")
//     const { name, phone, email, password, password2, image, address1, address2, area, pincode, city, state, country } = req.body;
//     const imageFilename = req.files['image'] ? req.files['image'][0].filename : null;

//     // Check if passwords match
//     if (password !== password2) {
//       throw new Error('Passwords do not match.');
//     }

//     if (!name || !imageFilename) {
//       throw new Error('Required fields are missing.');
//     }

//     const branchData = {
//       token: uuidv4(),
//       name,
//       phone,
//       email,
//       password: await bcrypt.hash("1234@user", 10),
//       image: imageFilename,
//       address1,
//       address2,
//       area,
//       pincode,
//       city,
//       state,
//       country,

//     };
    
//     // Check if the phone number exists in the database
//     const existingBranchByPhone = await Branch.findOne({ phone: branchData.phone });
//     if (existingBranchByPhone) {
//       console.log('Phone number is already used');
//       return res.redirect('/admin/branch/add')
//     }
//     console.log('Phone number succeeded');

//     // Check if the email already exists in the database
//     const existingUserByEmail = await Branch.findOne({ email: branchData.email });
//     if (existingUserByEmail) {
//       console.log('Email is already used');
//       return res.redirect('/admin/branch/add')
//     }
//     console.log('Email succeeded');


//     // Create a new user if all checks pass

//     console.log('All Check Passed');
//     const newBranch = new Branch(branchData); 
//     console.log(newBranch._id);
    
//     const branchProducts = [{
//         branch_id : newBranch._id,
//         status : true,
//     }];
//     console.log(branchProducts)

//     await newBranch.save();
//     console.log("Branch Added successfully");
//     // Update branch status for all products
//     await Product.updateMany(
//         {},
//         {
//             $set: {
//                 branch_status: branchProducts,
//             },
//         }
//     );  
//     console.log("Branch Details Sended to Products");
//     res.redirect('/admin/branch/all');
//   } catch (err) {
//     console.log("There is an issue please check once again");
//     console.log(err.message);
//     res.status(400).send(err.message);
//   }
// });






router.get('/detail/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching branch with ID:", customerId);

    // Find the customer in the database by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      // customer not found in the database
      throw new Error('Customer not found.');
    }

    // Send the category details to the client for updating
    const error = " Update Customer";
    res.render('admin/customer/details', { customer, user,route: route.baseUrL, error }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the customer for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});


// router.get('/update/:branchId', async (req, res) => {
//   try {
//     const branchId = req.params.branchId;
//     const user = req.session.user;

//     if (!user) {
//       return res.redirect('/admin/auth/login');
//     }
//     console.log("Fetching branch with ID:", branchId);

//     // Find the branch in the database by ID
//     const branch = await Branch.findById(branchId);

//     if (!branch) {
//       // branch not found in the database
//       throw new Error('Branch not found.');
//     }

//     // Send the category details to the client for updating
//     const error = " Update Branch";
//     res.render('admin/branch/update', { branch, user,route: route.baseUrL, error }); // Assuming you are using a template engine like EJS
//   } catch (err) {
//     console.log("There is an issue while fetching the branch for updating.");
//     console.log(err.message);
//     res.status(404).send(err.message);
//   }
// });

// router.post('/update/:branchId', upload.fields([
//   { name: 'image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
// ]), async (req, res) => {
//   try {
//     const branchId = req.params.branchId;
//     console.log("Updating branch with ID:", branchId);

//     const { name, phone, email, address1 , address2, area , pincode, city, state, country} = req.body;

//     // Find the branch in the database by ID
//     const branch = await Branch.findById(branchId);

//     if (!branch) {
//       // branch not found in the database
//       throw new Error('Branch not found.');
//     }

//     // Check if 'image' field is found in the request
//     if (req.files && req.files['image']) {
//       branch.image = req.files['image'][0].filename;
//     }

//     branch.name = name;
//     branch.phone = phone;
//     branch.email = email;
//     branch.address1 = address1;
//     branch.address2 = address2;
//     branch.area = area;
//     branch.city = city;
//     branch.state = state;
//     branch.country = country;

//     // Save the updated branch to the database
//     await branch.save();
//     console.log("Branch updated successfully");

//     res.redirect('/admin/branch/all?success="Branch Updated Successfully"');
//   } catch (err) {
//     console.log("There is an issue while updating the Branch.");
//     console.log(err.message);
//     res.status(400).send(err.message);
//   }
// });



// DELETE request to delete a category by its ID
router.delete('/delete/:customerId', async (req, res) => {
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



const fs = require('fs');
const { error } = require("console");

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


module.exports = router