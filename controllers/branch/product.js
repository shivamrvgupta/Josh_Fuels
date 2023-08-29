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
const Branch = require('../../models/branch/profile.js')
const BranchProduct = require('../../models/branch/product.js')


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
    res.render('branch/products/list', { user, product, productCount, route : route.baseUrL });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

// Update is selling 
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
    product.is_selling = !product.is_selling;
    await product.save();
    
    console.log('Database value updated successfully');
    res.json({ status: product.is_selling }); // Respond with the updated status
  } catch (err) {
    console.error('Error updating database value: ', err);
    res.status(500).send('Error updating database value');
  }
});

router.get('/update/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/branch/auth/login');
    }
    console.log("Fetching product with ID:", productId);

    // Find the product in the database by ID
    const product = await Product.findById(productId);

    if (!product) {
      // Product not found in the database
      throw new Error('Product not found.');
    }

    // Send the category details to the client for updating
    res.render('/branch/products/update_product', { product, user,route: route.baseUrL }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the category for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});


router.put('/update-price/:productId', async (req, res) => {
  try {
      const productId = req.params.productId;
      const location = req.body.location;
      const newPrice = parseFloat(req.body.price).toFixed(2);

      const product = await Product.findById(productId);

      if (!product) {
          return res.status(404).json({ error: 'Product not found' });
      }

      // Find the corresponding location entry and update the price
      const locationIndex = product.prices_by_location.findIndex(entry => entry.location === location);

      if (locationIndex === -1) {
          return res.status(404).json({ error: 'Location not found for the product' });
      }

      product.prices_by_location[locationIndex].price = newPrice;
      await product.save();

      return res.json(product); // Return the updated product
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
  }
});



// // DELETE request to delete a category by its ID
// router.delete('/delete/:categoryId', async (req, res) => {
//   try {
//     const categoryId = req.params.categoryId;
//     console.log("Deleting category with ID:", categoryId);

//     // Find and delete the category from the database
//     const deletedCategory = await Category.findOneAndDelete({ _id: categoryId });

//     if (!deletedCategory) {
//       // Category not found in the database
//       throw new Error('Category not found.');
//     }

//     // Delete the image files associated with the category (if applicable)
//     if (deletedCategory.image) {
//       deleteImageFile(deletedCategory.image);
//     }

//     if (deletedCategory.banner_image) {
//       deleteImageFile(deletedCategory.banner_image);
//     }

//     console.log("Category deleted successfully");

//     res.status(200).json({ message: 'Category deleted successfully' });
//   } catch (err) {
//     console.log("There is an issue while deleting the category.");
//     console.log(err.message);
//     res.status(400).send(err.message);
//   }
// });



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