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
            const branch = await models.BranchModel.Branch.find({});
            const branchCount = branch.length;
            const user = req.user;
        
            if (!user) {
              return res.redirect('/admin/auth/login');
            }
            const error = `Branch list`;
            res.render('admin/branch/lists', { Title: "All Branches",user, branch, branchCount, error});
          } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
          }
    },

  // Add Category List
    getAdd : async (req, res) => {
        try {
            const user = req.user;
        
            if (!user) {
              return res.redirect('/admin/auth/login');
            }
            const error = `Add new Branch`
            res.render('admin/branch/add', { Title: "Add new Branch", user, error});
          } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
          }
    },

  // Add Category List
    postAdd: async (req, res) => {
        const imageFilename = req.files['branch_image'] ? req.files['branch_image'][0].filename : null;
        const imgdata = {
            image: imageFilename,
        }
        try {
            console.log("I am here")
            const { name, phone, email, password, password2, image, address1, address2, area, pincode, city, state, country } = req.body;
        
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
            image: imageFilename,
            address1,
            address2,
            area,
            pincode,
            city,
            state,
            country,
        
            };
            
            // Check if the phone number exists in the database
            const existingBranchByPhone = await models.BranchModel.Branch.findOne({ phone: branchData.phone });
            if (existingBranchByPhone) {
            console.log('Phone number is already used');
            return res.redirect('/admin/branch/add')
            }
            console.log('Phone number succeeded');
        
            // Check if the email already exists in the database
            const existingUserByEmail = await models.BranchModel.Branch.findOne({ email: branchData.email });
            if (existingUserByEmail) {
            console.log('Email is already used');
            return res.redirect('/admin/branch/add')
            }
            console.log('Email succeeded');
        
        
            // Create a new user if all checks pass
        
            console.log('All Check Passed');
            const newBranch = new models.BranchModel.Branch(branchData); 
            console.log(newBranch._id);
            
            const branchProducts = [{
                branch_id : newBranch._id,
                status : false,
            }];
            console.log(branchProducts)
        
            await newBranch.save();
            console.log("Branch Added successfully");
            // Update branch status for all products
            await models.ProductModel.Product.updateMany(
                {},
                {
                    $set: {
                        branch_status: branchProducts,
                    },
                }
            );  
            console.log("Branch Details Sended to Products");
            res.redirect('/admin/branch/all');
        } catch (err) {
            // Delete the image file if an error occurs
            console.log("There is an issue please check once again");
            console.log(err.message);
            res.status(400).send(err.message);
        }
    },


  // Update Status
    updateStatus : async (req, res) => {
        try {
            const branchId = req.body.branchId;
            console.log(branchId)
            // Find the branch in the database by ID
            const branch = await models.BranchModel.Branch.findById(branchId);
        
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
    },

  // Edit Category
    getUpdate :  async (req, res) => {
        try {
            const branchId = req.params.branchId;
            const user = req.user;
        
            if (!user) {
              return res.redirect('/admin/auth/login');
            }
            console.log("Fetching branch with ID:", branchId);
        
            // Find the branch in the database by ID
            const branch = await models.BranchModel.Branch.findById(branchId);
        
            if (!branch) {
              // branch not found in the database
              throw new Error('Branch not found.');
            }
        
            // Send the category details to the client for updating
            const error = " Update Branch";
            res.render('admin/branch/update', { branch, user, error }); // Assuming you are using a template engine like EJS
          } catch (err) {
            console.log("There is an issue while fetching the branch for updating.");
            console.log(err.message);
            res.status(404).send(err.message);
          }
    },

  // Update Category
    postUpdate :  async (req, res) => {
        try {
            const branchId = req.params.branchId;
            console.log("Updating branch with ID:", branchId);
        
            const { name, phone, email, address1 , address2, area , pincode, city, state, country} = req.body;
        
            // Find the branch in the database by ID
            const branch = await models.BranchModel.Branch.findById(branchId);
        
            if (!branch) {
              // branch not found in the database
              throw new Error('Branch not found.');
            }
        
            // Check if 'image' field is found in the request
            if (req.files && req.files['branch_image']) {
              if (branch.image) {
                ImgServices.deleteImageFile(branch.image);
              }
              branch.image = req.files['branch_image'][0].filename;
            }
    
        
            branch.name = name;
            branch.phone = phone;
            branch.email = email;
            branch.address1 = address1;
            branch.address2 = address2;
            branch.area = area;
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
    },

  // Delete Category
  delete : async (req, res) => {
    try {
      const branchId = req.params.branchId;
      console.log("Deleting branch with ID:", branchId);
    
      // Find and delete the product from the database
      const deletedBranch = await models.BranchModel.Branch.findOneAndDelete({ _id: branchId });
  
      if (!deletedBranch) {
        // product not found in the database
        throw new Error('${} not found.');
      }
  
      if (deletedBranch.image) {
        ImgServices.deleteImageFile(deletedBranch.image);
        console.log("Deleted Image File", deletedBranch.image );
      }

      console.log(`${deletedBranch.name} deleted successfully`);
  
      res.status(200).json({ message: `${deletedBranch.name} deleted successfully` });
    } catch (err) {
      console.log(`There is an issue while deleting the ${deletedBranch.name}.`);
      console.log(err.message);
      res.status(400).send(err.message);
    }
  }
}





// Import

