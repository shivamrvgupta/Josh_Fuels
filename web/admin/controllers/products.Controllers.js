const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const {
  MessageConstants,
  StatusCodesConstants,
  ParamsConstants,
  
} = require('../../../managers/notify');
const secretKey = process.env.SECRET_KEY
const {
  ImgServices
} = require('../../../managers/services');
const { generateAccessToken} = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');

// This would be your token blacklist storage
const tokenBlacklist = new Set();




module.exports = {

  // Get Product List
    list : async (req, res) => {
        try {
            const product = await models.ProductModel.Product.find({});
            const productCount = product.length;
            const user = req.user;
        
            if (!user) {
              return res.redirect('/admin/auth/login');
            }
            const error = `Product Data`
            res.render('admin/products/list', { user, product, productCount , error});
          } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
          }    
    },

    getSubcategories : async ( req, res ) =>{
        try {
            const categoryId = req.query.category_id;
            const subcategories = await models.ProductModel.SubCategory.find({ parent_id: categoryId });
            res.json(subcategories);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

  // Add Category List
    getAdd : async (req, res) => {
        try {
            const categories = await models.ProductModel.Category.find({});
            const subcategories = await models.ProductModel.SubCategory.find({});
            const branch = await models.BranchModel.Branch.find({});
            const user = req.user;
        
            if (!user) {
              return res.redirect('/admin/auth/login');
            }
            error = `Add New Product`
            res.render('admin/products/add', { user, branch,categories, subcategories, error});
          } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
          }
    },

  // Add Category List
    postAdd: async (req, res) => {
      const imageFiles = req.files['image'];
      const imgdata = {
        image: imageFiles,
      }
      try {
        // Collect data from the form
        const { name, description, price, tax, tax_type, discount, discount_type, branches, category, sub_category, available_time_starts, available_time_ends, status } = req.body;

        if (!imageFiles || imageFiles.length === 0) {
          throw new Error("Image file is missing");
        }
        const imageFilename = imageFiles[0].filename;
        console.log('Image Filename:', imageFilename);
        console.log("branches --",branches);
        const selectedBranches = branches.map(branchId => ({
          branch_id: branchId,
          status: false // You can set the status as needed
        }));
        console.log("parsed --", selectedBranches);

        // Create a new product instance
        newProduct = new models.ProductModel.Product({
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

        console.log("Data stored in Status --- ", newProduct.branch_status);
        // Save the new product to the database
        const savedProduct = await newProduct.save();

        console.log('Product stored successfully');
        res.redirect('/admin/product/lists'); // Redirect to a suitable page after successful submission
      } catch (error) {
        console.error('Error adding product:', error);

        // Delete the image file if an error occurs
        if (imgdata.image && imgdata.image.length > 0) {
          const imageFilenameToDelete = imgdata.image[0].filename;
          ImgServices.deleteImageFile(imageFilenameToDelete);
          console.log(`Deleted image file: ${imageFilenameToDelete}`);
        }

        res.redirect('/admin/product/add?error=Please Check the Values Again'); // Redirect on error
      }
    },


  // Update Status
    updateStatus : async (req, res) => {
      try {
        const productId = req.body.productId;
        console.log(productId)
        // Find the product in the database by ID
        const product = await models.ProductModel.Product.findById(productId);
    
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
    },

  // Edit Category
    getUpdate :  async (req, res) => {
      try {
        const productId = req.params.id;
        const product = await models.ProductModel.Product
        .findById(productId)
        .populate('category')
        .populate('sub_category')
  
  
        const user = req.user;
  
        const categories = await models.ProductModel.Category.find();
        const subCategories = await models.ProductModel.SubCategory.find();
  
  
        if (!user) {
          return res.redirect('/admin/auth/login');
        }
  
        const error = `Update ${product.name}`

        res.render('admin/products/update_product', {
            user,
            product,
            categories,
            subCategories,
            error
        });
    } catch (error) {
        console.error('Error fetching data for update:', error);
        res.redirect('/admin/product/lists'); // Redirect to a suitable page after error
    }
    },

  // Update Category
    postUpdate :  async (req, res) => {
      try {
        const productId = req.params.productId;
        console.log("hey i am updateing ")
        // Collect data from the form
        const { name, description, price, tax, tax_type, discount, discount_type, category, selectedAddons, sub_category,available_time_starts, available_time_ends } = req.body;
    

         // Find the product by its ID
         const productToUpdate = await models.ProductModel.Product.findById(productId);
     
         if (!productToUpdate) {
           return res.status(404).send('Product not found');
         }
         if (req.files && req.files['image']) {
          // Delete the previous image file before updating with the new one
          if (productToUpdate.image) {
            ImgServices.deleteImageFile(productToUpdate.image);
          }
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
        productToUpdate.available_time_starts = available_time_starts;
        productToUpdate.available_time_ends = available_time_ends;
    
        // Save the updated product to the database
        await productToUpdate.save();
    
        res.redirect('/admin/product/lists'); // Redirect to a suitable page after successful update
      } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Internal Server Error');
      }
    },

  // Delete Category
  delete : async (req, res) => {
    try {
      const productId = req.params.productId;
      console.log("Deleting product with ID:", productId);
  
      // Find and delete the product from the database
      const deletedProduct = await models.ProductModel.Product.findOneAndDelete({ _id: productId });
  
      if (!deletedProduct) {
        // product not found in the database
        throw new Error('product not found.');
      }
  
      if (deletedProduct.image) {
        ImgServices.deleteImageFile(deletedProduct.image);
      }

      console.log("product deleted successfully");
  
      res.status(200).json({ message: 'product deleted successfully' });
    } catch (err) {
      console.log("There is an issue while deleting the product.");
      console.log(err.message);
      res.status(400).send(err.message);
    }
  },

  getDetail : async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await models.ProductModel.Product.findById(productId).populate('category').populate('sub_category');
      const user = req.user;
      const addon = await models.ProductModel.AddOn.find({})
      if (!user) {
        return res.redirect('/admin/auth/login');
      }
      res.render('admin/products/detail', { user,addon, product, error:"Product Detail"});
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  }
}

