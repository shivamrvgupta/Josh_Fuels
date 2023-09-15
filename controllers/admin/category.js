//jshint esversion:6
const express = require("express");
const router = express.Router();
const multer = require("multer");
const bodyParser = require("body-parser");
const jwt= require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
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
app.use(cookieParser());
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
const Category = require('../../models/products/category.js')
const Sub_Category = require('../../models/products/sub-category.js')


// Importing Routes

//Route to GET all categories
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.find({});
    const categoryCount = categories.length;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/categories/category', { Title: "All Category",user, categories, categoryCount, route : route.baseUrL, error: "List of Category"});
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

//Route to GET add New Category Page
router.get('/add', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/categories/add', { Title: "Add new Category",user, route : route.baseUrL, error: "Add New Category" });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

//Route to Post Add New Category
router.post('/add', authenticateToken, upload.fields([
  { name: 'image', maxCount: 1 },        // maxCount: 1 indicates only one image will be uploaded
  { name: 'banner_image', maxCount: 1 }, // maxCount: 1 indicates only one image will be uploaded
]), async (req, res) => {
  try {
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
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

//Route to Update the status of the category
router.post('/update-status', authenticateToken, async (req, res) => {
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

//Route to GET the CategoryUpdate Page
router.get('/update/:categoryId', authenticateToken, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const user = req.user;

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

    error = "Update the category";
    // Send the category details to the client for updating
    res.render('admin/categories/update-category', { category, error, user,route: route.baseUrL,error:"Update the Category" }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the category for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

//Route to POST the Update category
router.post('/update/:categoryId', authenticateToken, upload.fields([
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
      if (category.image) {
        deleteImageFile(category.image);
        category.image = req.files['image'][0].filename;
      }
    }

    // Check if 'banner_image' field is found in the request
    if (req.files && req.files['banner_image']) {
      if (category.banner_image) {
        deleteImageFile(category.banner_image);
      }
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
router.delete('/delete/:categoryId', authenticateToken, async (req, res) => {
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

// Sub_Category Part Starts here
router.get('/sub-category',authenticateToken ,  async (req, res) => {
  try {
    const subCategories = await Sub_Category.find().exec();
    const user = req.user;

    if(!user) {
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
      route: route.baseUrL,
      error: "List of Sub Category"
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/sub-category/add', authenticateToken, async (req, res) => {
  try {
    const category = await Category.find({});
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    res.render('admin/subCategory/add', { Title: "Add new Category",user, category,route : route.baseUrL , error:"Add new Sub category"});
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/sub-category/add',authenticateToken, async (req, res) => {
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


router.post('/sub/update-status', authenticateToken, async (req, res) => {
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


router.get('/sub/update/:subcategoryId', authenticateToken,  async (req, res) => {
  try {
    const subcategoryId = req.params.subcategoryId;
    const user = req.user;

    if (!user) {
      return res.redirect('/admin/auth/login');
    }
    console.log("Fetching category with ID:", subcategoryId);

    // Find the category in the database by ID
    const subcategory = await Sub_Category.findById(subcategoryId);

    if (!subcategory) {
      // SubCategory not found in the database
      throw new Error('SubCategory not found.');
    }

    // Send the category details to the client for updating
    res.render('admin/subCategory/update', { subcategory, user,route: route.baseUrL , error:"Update the Sub Category" }); // Assuming you are using a template engine like EJS
  } catch (err) {
    console.log("There is an issue while fetching the category for updating.");
    console.log(err.message);
    res.status(404).send(err.message);
  }
});

router.post('/sub/update/:subcategoryId', authenticateToken, async (req, res) => {
  try {
    const subcategoryId = req.params.subcategoryId;
    console.log("Updating Subcategory with ID:", subcategoryId);

    // Find the category in the database by ID
    const subcategory = await Sub_Category.findById(subcategoryId);

    if (!subcategory) {
      // Category not found in the database
      throw new Error('Category not found.');
    }

    // Update the fields if they are provided in the request
    if (req.body.name) {
      subcategory.name = req.body.name;
    }

    // Save the updated category to the database
    const updatedSubCategory = await subcategory.save();
    console.log("Category updated successfully");

    res.redirect('/admin/category/sub-category');
  } catch (err) {
    console.log("There is an issue while updating the category.");
    console.log(err.message);
    res.status(400).send(err.message);
  }
});

// DELETE request to delete a Subcategory by its ID
router.delete('/sub/delete/:subCategoryId', authenticateToken, async (req, res) => {
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
