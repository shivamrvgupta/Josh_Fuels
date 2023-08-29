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
const User = require('../../models/branch/profile')
const AddOn = require('../../models/products/add_on.js')
const Attribute = require('../../models/products/attribute.js')
const Category = require('../../models/products/category.js')
const Sub_Category = require('../../models/products/sub-category.js')
const Product = require('../../models/products/product.js')
const BranchProduct = require('../../models/branch/product.js')



const route = {
  baseUrL : "http://localhost:3000/",
};


// Importing Routes
  router.get('/products', async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.redirect('/branch/auth/login');
      }
      console.log("Current Branch",user._id);
      const products = await Product.find({
        'branch_status.branch_id': user._id,
      }).populate('category sub_category branch_status.branch_id');
      
      console.log("Master Products Retrevied Successfully")
      const productCount = products.length;

      res.render('branch/catalogue/product/lists', { user,products, productCount, route : route.baseUrL });
          
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  });


router.post('/update-status', async (req, res) => {
  try {
    const user = req.session.user;
    console.log("Current Branch", user._id);

    const productId = req.body.productId;

    const product = await Product.findOne({
      '_id': productId,
      'branch_status.branch_id': user._id,
    }).populate('branch_status.branch_id')
      .populate('category', 'name')  // Populates the category field with name only
      .populate('sub_category', 'name');

    if (!product) {
      console.log('Product not found for the given branch ID');
      return res.redirect('back');
    }

    const branchStatusForCurrentBranch = product.branch_status.find(branchStatus => branchStatus.branch_id.equals(user._id));

    if (!branchStatusForCurrentBranch) {
      console.log('No branch status found for the product with matching branch ID');
      return res.redirect('back');
    }

    const branchStatusId = branchStatusForCurrentBranch._id;
    const currentStatus = branchStatusForCurrentBranch.status;
    const newStatus = !currentStatus;

    console.log('Branch Status ID:', branchStatusId);
    console.log('New Status:', newStatus);

    // Update the status of branch_status
    branchStatusForCurrentBranch.status = newStatus;
    
    if (newStatus == true) {
      const existingBranchProduct = await BranchProduct.findOne({
        'branch_id': user._id,
        'main': product._id,
      });
    
      if (newStatus == true) {
        const existingBranchProduct = await BranchProduct.findOne({
          'branch_id': user._id,
          'main': product._id,
        });
      
        console.log(existingBranchProduct);
        console.log(user._id)
        if (!existingBranchProduct) {
          const branchProduct = new BranchProduct({
            name : "name",
            branch_id: user._id,
            main: product._id,
            token: uuidv4(),
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            tax: product.tax,
            tax_type: product.tax_type,
            discount: product.discount,
            discount_type: product.discount_type,
            category: product.category.name,
            sub_category: product.sub_category.name,
            available_time_starts: product.available_time_starts,
            available_time_ends: product.available_time_ends,
            is_selling: true
          });
      
          await branchProduct.save();
          console.log(branchProduct);
          console.log('New branch product replicated and status set to true');
        }
      
        // Update the product status in the master_product collection
        product.status = newStatus;
        await product.save();
      
        console.log("Product status updated:", newStatus);
      }
      
    
      await product.save();
    
      console.log("Product status updated:", newStatus);
    }

    await product.save();
    console.log('The new status is false');

    return res.redirect('back');
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).send('Error updating status');
  }
});



// router.post('/update-status', async (req, res) => {

//   const productId = req.body.productId;
//   const branchId = req.body.branchId;

//   const branchExist = products.some(product => product.id === branchId);

//   console.log(productExists);

//   try {
//     console.log("INDEX ________ ",branchExist)
//     console.log("ID ________ ",branchId)
//     console.log("INDEX ________ ",productId)
//       // Find the product by ID
//       const product = await Product.findById(productId);

//       if (!product) {
//           return res.send('Product not found');
//       }

//       // Update the status based on the specified branch index
//       if (branchIndex !== undefined) {
//           product.branch_status[branchIndex].status = !product.branch_status[branchIndex].status;
//           await product.save();
//       }

//       // Redirect back to the referring page (same page)
//       return res.redirect('back');
//   } catch (error) {
//       console.error('Error updating status:', error);
//       res.status(500).send('Error updating status');
//   }
// });




// // Check if a product is already replicated
// router.post('/check-replicated/:bproductId', async (req, res) => {
//     const productId = req.params.bproductId;

//     try {
//         const existingBranchRecord = await BProduct.findById(productId);

//         if (!existingBranchRecord) {
//             return res.status(404).json({ error: 'Branch record not found.' });
//         }

//         existingBranchRecord.status = !existingBranchRecord.status;
//         await existingBranchRecord.save();

//         console.log('Database value updated successfully');
//         res.json({ status: existingBranchRecord.status });
//     } catch (error) {
//         console.error('Error updating status:', error);
//         res.status(500).json({ error: 'An error occurred while updating status.' });
//     }
// });


module.exports = router