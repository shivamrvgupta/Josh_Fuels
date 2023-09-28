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
        const user = req.user;
        if (!user) {
          return res.redirect('/branch/auth/login');
        }
        console.log("Current Branch",user.userId);
        const products = await models.ProductModel.Product.find({
          'branch_status.branch_id': user.userId,
        }).populate('category') 
        .populate('sub_category')
        .populate('branch_status.branch_id');
        
        console.log("Master Products Retrevied Successfully")
        const productCount = products.length;
  
        const error = "Main Products Catalogue";

        res.render('branch/catalogue/product/lists', { user,products, productCount, error });
            
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
        const user = req.user;
        console.log("Current Branch", user.userId);
    
        const productId = req.body.productId;
    
        const product = await models.ProductModel.Product.findOne({
          '_id': productId,
          'branch_status.branch_id': user.userId,
        }).populate('branch_status.branch_id')
          .populate('category', 'name')  // Populates the category field with name only
          .populate('sub_category', 'name');
    
        if (!product) {
          console.log('Product not found for the given branch ID');
          return res.redirect('back');
        }
    
        const branchStatusForCurrentBranch = product.branch_status.find(branchStatus => branchStatus.branch_id.equals(user.userId));
    
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
          const existingBranchProduct = await models.BranchModel.BranchProduct.findOne({
            'branch': user.userId,
            'main': product.id,
          });
        

          console.log(
            await models.BranchModel.BranchProduct.findOne({
              'branch_id': user.userId,
              'main': product._id,
            })
          );
          console.log(user.userId)
          if (!existingBranchProduct) {
            console.log("It enter in Existing")
            const branchProduct = new models.BranchModel.BranchProduct({
              branch_id: user.userId, // This should now be correctly saved
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
        }
        const existingBranchProduct = await models.BranchModel.BranchProduct.findOne({
          'branch': user.userId,
          'main': product.id,
        });

        console.log("Catalogue Product status updated:", newStatus);

        const currentBranchStatus = existingBranchProduct.status;
        const newBranchStatus = !currentBranchStatus;
        existingBranchProduct.status = newBranchStatus;

        await existingBranchProduct.save();
        console.log("Product status updated:", newStatus);

        await product.save();
        console.log('The new status is false');
    
        return res.redirect('back');
      } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).send('Error updating status');
      }
    },
}

