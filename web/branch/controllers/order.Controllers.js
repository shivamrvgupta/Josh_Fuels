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
        try{
            const user = req.user;
        
            if(!user){
              return res.redirect('/branch/auth/login')
            }
          const orders = await models.BranchModel.Order
          .find()
          .populate('user_id')
          .populate('product_id')
        
          const customer = await models.UserModel.User.find()
          const ordersCount = orders.length;
          res.render("branch/order/all", {user, ordersCount, customer, orders, error: "List of Orders"});
          }catch(err){
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    },


    // Customer Details

    getCustomer : async (req, res) => {
        try {
            const customerId = req.params.customerId;
            const user = req.user;
        
            if (!user) {
              return res.redirect('/branch/auth/login');
            }
            console.log("Fetching branch with ID:", customerId);
        
            // Find the customer in the database by ID
            const customer = await models.UserModel.User.findById(customerId);
            const address = await models.UserModel.Address.findOne({user_id: customerId})
            const orders = await models.BranchModel.Order.find({user_id : customerId})
                .populate('product_id')           // Populate the 'cart' field

            const branchProduct = await models.BranchModel.BranchProduct.find();
        


            if (!customer) {
              // customer not found in the database
              throw new Error('Customer not found.');
            }
        
            // Send the category details to the client for updating
            const error = "Customer Overview";
            res.render('branch/customer/details', { customer, address,user, branchProduct, orders, error }); // Assuming you are using a template engine like EJS
          } catch (err) {
            console.log("There is an issue while fetching the customer for updating.");
            console.log(err.message);
            res.status(404).send(err.message);
          }
    },

    getAdd : async (req, res) => {
      try {
        const user = req.user;
    
        if (!user) {
          return res.redirect('/branch/auth/login');
        }
        res.render('branch/customer/add', {user,error:"Add New Customer" });
      } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
      }
    },

  // Add Category List
    postAdd: async (req, res) => {
      try{
        const { first_name,last_name, email, phone, company, accept_term} = req.body;
        const imageFilename = req.files['customer_image'] ? req.files['customer_image'][0].filename : null;
    
        const acceptTerm = accept_term === "true";

        if (!first_name || !last_name || !email || !phone || !company) {
          throw new Error('Required fields are missing.');
        }
    
        const customer = new models.UserModel.User({
          first_name,
          last_name,
          email,
          phone,
          company,
          usertype: "Customer",
          profile: imageFilename,
          is_active : true,
          accept_term : acceptTerm
        })
    
    
        await customer.save();
        console.log("Customer added successfully");
        res.redirect('/branch/customer/list');
    
      }catch(err){
        console.log(err);
        res.status(500).send('Internal Server Error');
      }
    },


  // Update Status
    updateStatus : async (req, res) => {
        try {
            const customerId = req.body.customerId;
            console.log(customerId)
            // Find the branch in the database by ID
            const customer = await models.UserModel.User.findById(customerId,{usertype : "Customer"});
        
            if (!customer) {
                // Branch not found in the database
                return res.status(404).send('customer not found');
            }
        
            // Toggle the status (true to false or false to true) and save the updated branch
            customer.is_active = !customer.is_active;
            await customer.save();
            
            console.log('Database value updated successfully');
            res.json({ is_active: customer.is_active }); // Respond with the updated status
        } catch (err) {
          console.error('Error updating database value: ', err);
            res.status(500).send('Error updating database value');
        }
    },

  // Edit Category
    getUpdate :  async (req, res) => {
      try {
        const customerId = req.params.customerId;
        const user = req.user;
    
        if (!user) {
          return res.redirect('/branch/auth/login');
        }
        console.log("Fetching customer with ID:", customerId);
    
        // Find the customer in the database by ID
        const customer = await models.UserModel.User.findById(customerId);
        const address = await models.UserModel.Address.findOne({user_id: customerId});
        console.log(address);
        if (!customer) {
          // customer not found in the database
          throw new Error('Customer not found.');
        }
    
        res.render('branch/customer/update', {address, customer, user, error: " Update Customer" }); // Assuming you are using a template engine like EJS
      } catch (err) {
        console.log("There is an issue while fetching the customer for updating.");
        console.log(err.message);
        res.status(404).send(err.message);
      }
    },

  // Update Category
    postUpdate :  async (req, res) => {
      try {
        const customerId = req.params.customerId;
        console.log("Updating customer with ID:", customerId);
    
        const { first_name, last_name, phone, email, company, address1, address2 , area, pincode, city, state, country} = req.body;
    
        // Find the customer in the database by ID
        const customer = await models.UserModel.User.findById(customerId);
        const address = await models.UserModel.Address.findOne({user_id: customerId});
        console.log(address);
        if (!customer) {
          // customer not found in the database
          if(!address){
            throw new Error("Address not found")
          }
          throw new Error('Customer not found.');
        }
    
        // Check if 'image' field is found in the request
        if (req.files && req.files['customer_image']) {
          if(customer.profile){
            ImgServices.deleteImageFile(customer.profile);
          }
          customer.profile = req.files['customer_image'][0].filename;
        }
    
        customer.first_name = first_name;
        customer.last_name = last_name
        customer.phone = phone;
        customer.email = email;
        customer.company = company;
        address.address_1 = address1;
        address.address_2 = address2;
        address.area = area;
        address.pincode = pincode;
        address.city = city;
        address.state = state;
        address.country = country;
    
        // Save the updated customer to the database
        await customer.save();
        await address.save();
        console.log("Customer updated successfully");
    
        res.redirect('/branch/customer/list');
      } catch (err) {
        console.log("There is an issue while updating the Customer.");
        console.log(err.message);
        res.status(400).send(err.message);
      }
    },

  // Delete Category
  delete : async (req, res) => {
    try {
      const customerId = req.params.customerId;
      console.log("Deleting branch with ID:", customerId);
    
      // Find and delete the product from the database
      const deletedCustomer = await models.UserModel.User.findOneAndDelete({ _id: customerId });
  
      if (!deletedCustomer) {
        // product not found in the database
        throw new Error(`${deletedCustomer} not found.`);
      }
  
      if (deletedCustomer.image) {
        ImgServices.deleteImageFile(deletedCustomer.profile);
        console.log("Deleted Image File", deletedCustomer.profile );
      }

      console.log(`${deletedCustomer.name} deleted successfully`);
  
      res.status(200).json({ message: `${deletedCustomer.name} deleted successfully` });
    } catch (err) {
      console.log(`There is an issue while deleting`);
      console.log(err.message);
      res.status(400).send(err.message);
    }
  }
}



