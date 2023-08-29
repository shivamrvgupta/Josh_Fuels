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
const User = require('../../models/users/user.js')
const Device = require('../../models/users/device.js')
const Address = require('../../models/users/address.js')
const AddOn = require('../../models/products/add_on.js')
const Attribute = require('../../models/products/attribute.js')
const Branch = require('../../models/branch/profile.js')
const Category = require('../../models/products/category.js')
const Sub_Category = require('../../models/products/sub-category.js')
const Product = require('../../models/products/product.js')


const route = {
  baseUrL : "http://localhost:3000/",
};



// Importing Routes

router.get('/lists', async (req, res) => {
  try {
    const product = await Product.find({});
    const productCount = product.length;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/products/list', { user, product, productCount, route : route.baseUrL });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/add', async (req, res) => {
  try {
    const categories = await Category.find({});
    const subcategories = await Sub_Category.find({});
    const branch = await Branch.find({});
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/products/add', { user, branch,categories, subcategories ,route : route.baseUrL });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/getSubcategories', async (req, res) => {
  try {
      const categoryId = req.query.category_id;
      const subcategories = await Sub_Category.find({ parent_id: categoryId });
      res.json(subcategories);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/add', upload.fields([
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    // Collect data from the form
    const { name, description, price, tax, tax_type, discount, discount_type, branches, category, sub_category, available_time_starts, available_time_ends, status } = req.body;
    const imageFiles = req.files['image'];

    if (!imageFiles || imageFiles.length === 0) {
      throw new Error("Image file is missing");
    }
    const imageFilename = imageFiles[0].filename;
    console.log('Image Filename:', imageFilename);
    console.log("branches --",branches)
    const selectedBranches = branches.map(branchId => ({
      branch_id: branchId,
      status: false // You can set the status as needed
    }));
    console.log("parsed --", selectedBranches)
    // Create a new product instance
    const newProduct = new Product({
      token: uuidv4(),
      name,
      description,
      price,
      tax,
      tax_type,
      discount,
      discount_type,
      image: imageFilename,
      category,
      sub_category,
      available_time_starts,
      available_time_ends,
      status,
      branch_status: selectedBranches,
    });

    console.log("Data stored in Status --- ",newProduct.branch_status)
    // Save the new product to the database
    const savedProduct = new Product(newProduct);
    await savedProduct.save();
    
    console.log('Product stored successfully');
    res.redirect('/admin/product/lists'); // Redirect to a suitable page after successful submission
  } catch (error) {
    console.error('Error adding product:', error);
    res.redirect('/admin/product/add?error=Please Check the Values Again'); // Redirect on error
  }
});



router.post('/update-status', async (req, res) => {
  const productId = req.body.productId;
  console.log(productId)
  try {
    // Find the product in the database by ID
    const product = await Product.findById(productId);

    if (!product) {
      // product not found in the database
      return res.status(404).send('product not found');
    }

    // Toggle the status (true to false or false to true) and save the updated product
    product.status = !product.status;
    await product.save();
    
    console.log('Database value updated successfully');
    res.json({ status: product.status }); // Respond with the updated status
  } catch (err) {
    console.error('Error updating database value: ', err);
    res.status(500).send('Error updating database value');
  }
});

router.get('/update/:id', async (req, res) => {
  try {
      const productId = req.params.id;
      const product = await Product
      .findById(productId)
      .populate('category')
      .populate('sub_category')


      user = req.session.user;

      const categories = await Category.find();
      const subCategories = await Sub_Category.find();


      if (!user) {
        return res.redirect('/admin/auth/login');
      }

      res.render('admin/products/update_product', {
          user,
          route : route.baseUrL,
          product,
          categories,
          subCategories,
      });
  } catch (error) {
      console.error('Error fetching data for update:', error);
      res.redirect('/admin/product/lists'); // Redirect to a suitable page after error
  }
});




router.post('/update/:productId', upload.fields([
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const productId = req.params.productId;

    // Collect data from the form
    const { name, description, price, tax, tax_type, discount, discount_type, category, selectedAddons, sub_category,available_time_starts, available_time_ends } = req.body;

     // Parse the selected addon IDs from the JSON data
     const parsedSelectedAddons = JSON.parse(selectedAddons);
     // Find the product by its ID
     const productToUpdate = await Product.findById(productId);
 
     if (!productToUpdate) {
       return res.status(404).send('Product not found');
     }
    if (req.files && req.files['image']) {
      productToUpdate.image = req.files['image'][0].filename;
    }

    // Update the product fields
    productToUpdate.name = name;
    productToUpdate.description = description;
    productToUpdate.price = price;
    productToUpdate.tax = tax;
    productToUpdate.tax_type = tax_type;
    productToUpdate.discount = discount;
    productToUpdate.discount_type = discount_type;
    productToUpdate.category = category;
    productToUpdate.sub_category = sub_category;
    productToUpdate.addons = parsedSelectedAddons;
    productToUpdate.available_time_starts = available_time_starts;
    productToUpdate.available_time_ends = available_time_ends;

    // Save the updated product to the database
    await productToUpdate.save();

    res.redirect('/admin/product/lists'); // Redirect to a suitable page after successful update
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Internal Server Error');
  }
});



// DELETE request to delete a product by its ID
router.delete('/delete/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log("Deleting product with ID:", productId);

    // Find and delete the product from the database
    const deletedProduct = await Product.findOneAndDelete({ _id: productId });

    if (!deletedProduct) {
      // product not found in the database
      throw new Error('product not found.');
    }

    console.log("product deleted successfully");

    res.status(200).json({ message: 'product deleted successfully' });
  } catch (err) {
    console.log("There is an issue while deleting the product.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});



const fs = require('fs');

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