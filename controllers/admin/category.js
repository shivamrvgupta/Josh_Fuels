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
const Category = require('../../models/products/category.js')
const Sub_Category = require('../../models/products/sub-category.js')


const route = {
  baseUrL : "http://localhost:3000/",
};


// Importing Routes

router.get('/all', async (req, res) => {
  try {
    const categories = await Category.find({});
    const categoryCount = categories.length;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/categories/category', { Title: "All Category",user, categories, categoryCount, route : route.baseUrL, error: "List of Category"});
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/add', async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/categories/add', { Title: "Add new Category",user, route : route.baseUrL, error: "Add New Category" });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/add', upload.fields([
  { name: 'image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
  { name: 'banner_image', maxCount: 1 }, // maxCount: 1 indicates only one image will be uploaded
]), async (req, res) => {
  try {
    console.log("I am here")
    const { name } = req.body;
    const imageFilename = req.files['image'] ? req.files['image'][0].filename : null;
    const bannerImageFilename = req.files['banner_image'] ? req.files['banner_image'][0].filename : null;

    if (!name || !imageFilename || !bannerImageFilename) {
      throw new Error('Required fields are missing.');
    }

    const categoryData = {
      token: uuidv4(),
      name,
      image: imageFilename,
      banner_image: bannerImageFilename,
    };

    const newCategory = new Category(categoryData);
    await newCategory.save();
    console.log("Category Added successfully");
    res.redirect('/admin/category/all');
  } catch (err) {
    console.log("There is an issue please check once again");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

router.post('/update-status', async (req, res) => {
  const categoryId = req.body.categoryId;
  console.log(categoryId)
  try {
    // Find the category in the database by ID
    const category = await Category.findById(categoryId);

    if (!category) {
      // Category not found in the database
      return res.status(404).send('Category not found');
    }

    // Toggle the status (true to false or false to true) and save the updated category
    category.status = !category.status;
    await category.save();
    
    console.log('Database value updated successfully');
    res.json({ status: category.status }); // Respond with the updated status
  } catch (err) {
    console.error('Error updating database value: ', err);
    res.status(500).send('Error updating database value');
  }
});


router.get('/update/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching category with ID:", categoryId);

    // Find the category in the database by ID
    const category = await Category.findById(categoryId);

    if (!category) {
      // Category not found in the database
      throw new Error('Category not found.');
    }

    // Send the category details to the client for updating
    res.render('admin/categories/update-category', { category, user,route: route.baseUrL }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the category for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/update/:categoryId', upload.fields([
  { name: 'image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
  { name: 'banner_image', maxCount: 1 }, // maxCount: 1 indicates only one image will be uploaded
]), async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    console.log("Updating category with ID:", categoryId);

    // Find the category in the database by ID
    const category = await Category.findById(categoryId);

    if (!category) {
      // Category not found in the database
      throw new Error('Category not found.');
    }

    // Update the fields if they are provided in the request
    if (req.body.name) {
      category.name = req.body.name;
    }

    // Check if 'image' field is found in the request
    if (req.files && req.files['image']) {
      category.image = req.files['image'][0].filename;
    }

    // Check if 'banner_image' field is found in the request
    if (req.files && req.files['banner_image']) {
      category.banner_image = req.files['banner_image'][0].filename;
    }

    // Save the updated category to the database
    const updatedCategory = await category.save();
    console.log("Category updated successfully");

    res.redirect('/admin/category/all');
  } catch (err) {
    console.log("There is an issue while updating the category.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});



// DELETE request to delete a category by its ID
router.delete('/delete/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    console.log("Deleting category with ID:", categoryId);

    // Find and delete the category from the database
    const deletedCategory = await Category.findOneAndDelete({ _id: categoryId });

    if (!deletedCategory) {
      // Category not found in the database
      throw new Error('Category not found.');
    }

    // Delete the image files associated with the category (if applicable)
    if (deletedCategory.image) {
      deleteImageFile(deletedCategory.image);
    }

    if (deletedCategory.banner_image) {
      deleteImageFile(deletedCategory.banner_image);
    }

    console.log("Category deleted successfully");

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.log("There is an issue while deleting the category.");
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



// Sub_Category Part

router.get('/sub-category', async (req, res) => {
  try {
    const subCategories = await Sub_Category.find().exec();
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }

    const populatedSubCategories = await Promise.all(subCategories.map(async (subCategory) => {
      const categoryId = subCategory.parent_id;
      try {
        const category = await Category.findById(categoryId).exec();

        if (!category) {
          console.log('Parent category not found for subcategory:', subCategory.name);
          return null;
        }

        return {
          subCategory,
          categoryName: category.name,
        };
      } catch (error) {
        console.error('Error fetching parent category:', error);
        return null;
      }
    }));

    const validPopulatedSubCategories = populatedSubCategories.filter(item => item !== null);

    res.render('admin/subCategory/list', {
      Title: "All Category",
      user,
      subCategories: validPopulatedSubCategories,
      subCategoryCount: validPopulatedSubCategories.length,
      route: route.baseUrL
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/sub-category/add', async (req, res) => {
  try {
    const category = await Category.find({});
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/subCategory/add', { Title: "Add new Category",user, category,route : route.baseUrL });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/sub-category/add', async (req, res) => {
  try {
    console.log("I am here")
    console.log(req.body.name)
    const { name, parent_id } = req.body;

    if (!name || !parent_id) {
      throw new Error('Required fields are missing.');
    }

    // Check if the parent_id exists in the database
    const parentCategory = await Category.findById(parent_id);
    if (!parentCategory) {
      throw new Error('Parent category not found.');
    }

    const subData = {
      token: uuidv4(),
      name,
      parent_id,
    };

    const newSubCategory = new Sub_Category(subData);
    await newSubCategory.save();
    console.log("Sub Category Added successfully");
    res.redirect('/admin/category/sub-category');
  } catch (err) {
    console.log("There is an issue please check once again");
    console.log(err.message);
    
    // If the parent_id doesn't exist, delete the newly added subcategory
    if (err.message === 'Parent category not found.') {
      await newSubCategory.remove();
    }

    res.status(400).send(err.message);
  }
});


router.post('/sub/update-status', async (req, res) => {
  const categoryId = req.body.categoryId;
  console.log(categoryId)
  try {
    // Find the category in the database by ID
    const category = await Sub_Category.findById(categoryId);

    if (!category) {
      // Category not found in the database
      return res.status(404).send('Category not found');
    }

    // Toggle the status (true to false or false to true) and save the updated category
    category.status = !category.status;
    await category.save();
    
    console.log('Database value updated successfully');
    res.json({ status: category.status }); // Respond with the updated status
  } catch (err) {
    console.error('Error updating database value: ', err);
    res.status(500).send('Error updating database value');
  }
});



router.get('/sub/update/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const user = req.session.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching category with ID:", categoryId);

    // Find the category in the database by ID
    const category = await Sub_Category.findById(categoryId);

    if (!category) {
      // Category not found in the database
      throw new Error('Category not found.');
    }

    // Send the category details to the client for updating
    res.render('admin/subCategory/update', { category, user,route: route.baseUrL }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the category for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/sub/update/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    console.log("Updating category with ID:", categoryId);

    // Find the category in the database by ID
    const category = await Sub_Category.findById(categoryId);

    if (!category) {
      // Category not found in the database
      throw new Error('Category not found.');
    }

    // Update the fields if they are provided in the request
    if (req.body.name) {
      category.name = req.body.name;
    }

    // Save the updated category to the database
    const updatedCategory = await category.save();
    console.log("Category updated successfully");

    res.redirect('/admin/category/sub-category');
  } catch (err) {
    console.log("There is an issue while updating the category.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});



// DELETE request to delete a category by its ID
router.delete('/sub/delete/:subCategoryId', async (req, res) => {
  try {
    const subCategoryId = req.params.subCategoryId;

    // Find and delete the sub-category in the database by ID
    const deletedSubCategory = await Sub_Category.findByIdAndDelete(subCategoryId);

    if (!deletedSubCategory) {
      throw new Error('Sub-category not found.');
    }

    console.log("Sub Category Deleted successfully");
    res.status(200).send("Sub Category Deleted successfully");
  } catch (err) {
    console.log("There is an issue while deleting the sub-category.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});










module.exports = router