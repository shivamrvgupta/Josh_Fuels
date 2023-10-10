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
  JwtService,
  UserService,
} = require('../../../managers/services');
const { generateAccessToken} = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');

// This would be your token blacklist storage
const tokenBlacklist = new Set();

const options = { day: '2-digit', month: 'short', year: 'numeric' };


module.exports = {

  // Verify OTP API
    getLogin : async (req, res) => {
      console.log("I am ready")
        res.render('a-login',{
          title: "admin" ,
          redirect : "branch" ,
          error: "Welcome to Login"
        })
    },

  // User Login API
    verifyLogin : async (req, res) => {
      const loginData = {
        email: req.body.email,
        password: req.body.password,
        remember: req.body.remember,
      };

      console.log(loginData)
      try {
          // Check if the mobile number exists in the database
          const userExists = await models.UserModel.User.findOne({ email: loginData.email });

          console.log(userExists)

          if (!userExists) {
              return res.redirect(`/admin/auth/login?error=User Not Found${encodeURIComponent(loginData.email)}`);
          }

          // Generate and send OTP
          const isPasswordValid = await bcrypt.compare(loginData.password, userExists.password);

          if (!isPasswordValid) {
              return res.redirect(`/admin/auth/login?error=Invalid email or password&email=${encodeURIComponent(loginData.email)}`);
          }

          // Check if the user's usertype is "admin"
          if (userExists.usertype !== 'Admin') {
              return res.redirect('/admin/auth/login?error=You do not have permission to access the admin panel.');
          }

          const token = generateAccessToken(userExists);
          
          //  Set the token as a cookie or in the response body, depending on your preference
          if (loginData.remember) {
            res.cookie('jwt',  token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true }); 
          } else {
            res.cookie('jwt', token, { httpOnly: true });
          }
          res.return = token;
          
          return res.redirect('/admin/auth/dashboard');
    
      } catch (error) {
        console.error('Error during login:', error);
        return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ status: false, status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR, message: MessageConstants.INTERNAL_SERVER_ERROR, data: {} });
      }
    },
  
  // User Dashboard API
    getdashboard : async (req, res) => {
      const user = req.user;
      const orderInfo = await models.BranchModel.Order.find();
      const allOrders = orderInfo.length;

      const products = await models.ProductModel.Product.find();
      const allProducts = products.length;

      const users = await models.UserModel.User.find({usertype: "Customer"});
      const allCustomers = users.length;

      const addOn = await models.ProductModel.AddOn.find();

      const orderDetail = await models.BranchModel.Order.aggregate([
        {
          $match: {
            status: "Delivered",
            payment_status: true
          }
        },
        {
          $unwind: "$product_items" // Unwind the product_items array
        },
        {
          $group: {
            _id: "$product_items.product_id",
            totalRevenue: { $sum: "$grand_total" },
            totalQuantity: { $sum: "$product_items.quantity" }
          }
        }
      ]);
      
            // Now you can access product quantities dynamically
            const totalRevenue = orderDetail.length > 0 ? orderDetail[0].totalRevenue : 0;
            const totalQuantity = orderDetail.length > 0 ? orderDetail[0].totalQuantity : 0;
      
          const productQuantities = {};


          // Populate the productQuantities object
          orderDetail.forEach((productDetail) => {
            const productId = productDetail._id;
            const totalQuantitySold = productDetail.totalQuantity;
            
            // Assign variables dynamically based on product IDs
            productQuantities[productId] = totalQuantitySold;
          });

          // Access product quantities dynamically
          for (const productId in productQuantities) {
            console.log(`Total Quantity Sold for Product ${productId}: ${productQuantities[productId]}`);
          }
          

          console.log("Total Revenue for Delivered Orders with Payment Status True: " + totalRevenue);

            // Transform the data into arrays for charting
        const quantities = orderDetail.map(item => item.totalQuantity);


      error = "You are successfully logged in"
      res.render('admin/dashboard', { options, allOrders, allProducts, totalRevenue, totalQuantity, allCustomers , products, addOn ,user: user, error ,productQuantities , productQuantities: JSON.stringify({ quantities })})
    },

  // User Logout API
    logout:(req, res) => {
      try {
        // Clear the user session
        const user = req.user;

        res.clearCookie('jwt'); // Clear the JWT cookie
        
        res.redirect('admin/auth/login')
        

      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).send('An error occurred during logout.');
      }
    },

    pageNotFound : async (req, res) => {
        const user = req.user;
          
        console.log(user)
        if (!user) {
          return res.redirect('/admin/auth/login');
        }
        
        res.status(404).render('partials/404', {user}); // Render the pagenotfound.ejs view
    },
    
    redirecter : async (req, res) => {
        const user = req.user;
          
        console.log(user)
        if (!user) {
          return res.redirect('/admin/auth/login');
        }

        if(user.usertype == 'Admin'){
          res.redirect('/admin/auth/dashboard');
        }
        
        res.redirect('/branch/auth/dashboard');
    }

}

