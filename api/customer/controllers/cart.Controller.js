const {
    MessageConstants,
    StatusCodesConstants,
    
  } = require('../constants');
  const { Validator} = require('../utils');
  const models = require('../models');
  
  
  
  module.exports = {
  // Get Cart Data
    cartList : async (req, res) => {
      try {
        const session = req.user;
        user_id = session.userId;

        console.log(`User ${session.first_name} Fetching Cart Data`)

        if(!user_id){
          return res.status(StatusCodesConstants.ACCESS_DENIED).json({
            status: false,
            status_code: StatusCodesConstants.ACCESS_DENIED,
            message: MessageConstants.NOT_LOGGED_IN,
          })
        }
  
        // Fetch user's city based on the sessions user_id
        const cart = await models.BranchModel.Cart.find({ user_id : session.userId });
        const cartCount = cart.length;
        console.log(cart)
        
        if(!cart || cart.length === 0){
          console.log(`User ${session.first_name , MessageConstants.CART_FETCHED_SUCCESSFULLY, MessageConstants.CART_EMPTY}`)
            return res.status(StatusCodesConstants.SUCCESS).json({
                status: true,
                status_code: StatusCodesConstants.SUCCESS,
                message: MessageConstants.CART_EMPTY,
                data: {
                    cartCount: cartCount,
                    cartData: [],
                },
            });
        }else{

          const populatedCart = [];

          // Iterate through each cart item
          for (const cartItem of cart) {
            // Manually populate the product and branch details from the referenced models
            const productInfo = await models.BranchModel.BranchProduct.find({ _id: cartItem.product_id });
            const branchInfo = await models.BranchModel.Branch.find({ _id: cartItem.branch_id });

            if (productInfo && branchInfo) {
              // Create a new object with specific fields from product and branch
              const cartItemData = {
                cart_id : cartItem._id,
                product_id : cartItem.product_id,
                product_name: productInfo.name,
                product_img: productInfo.image,
                price: cartItem.price,
                quantity: cartItem.quantity,
                coupon_discount: cartItem.coupon_discount,
                delivery_fee: cartItem.delivery_fee,
                total_price: cartItem.total_price,
                branch: {
                  branch_id: cartItem.branch_id,
                  branch_name: branchInfo.name,
                },
              };

              populatedCart.push(cartItemData);
            }
          }

          console.log(`User ${session.first_name} ${MessageConstants.CART_FETCHED_SUCCESSFULLY}`)
          return res.status(StatusCodesConstants.SUCCESS).json({
              status: true,
              status_code: StatusCodesConstants.SUCCESS,
              message: MessageConstants.CART_FETCHED_SUCCESSFULLY,
              data: {
                cartCount: cartCount,
                cartData: populatedCart,
              },
          });
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
      }
    }, 
  
  // Add Cart Data 
  addCartData: async (req, res) => {
    try {
      const session = req.user;
      const user_id = session.userId;
  
      console.log(`User ${session.first_name} Adding Data to Cart`)

      if (!user_id) {
        return res.status(StatusCodesConstants.ACCESS_DENIED).json({
          status: false,
          status_code: StatusCodesConstants.ACCESS_DENIED,
          message: MessageConstants.NOT_LOGGED_IN,
        });
      }
  
      const cartData = {
        user_id: session.userId,
        branch_id: req.body.branch,
        product_id: req.body.product,
        quantity: req.body.quantity,
        total_price: req.body.total_price,
      };
  
      const validationResult = Validator.validate(cartData, {
        branch_id: {
          presence : {allowEmpty :false},
        },
        product_id : {
          presence : {allowEmpty : false }
        },
        quantity: {
          presence: { allowEmpty: false },
          length: { minimum: 1, maximum: 100 },
        },
        total_price: {
          presence: { allowEmpty: false }, 
        }
      });
  
      if (validationResult) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: MessageConstants.VALIDATION_ERROR,
          data: validationResult,
        });
      }
  
      // Step 1: Check if there is already a cart item with the same user_id, branch_id, and product_id
      const existingCartItem = await models.BranchModel.Cart.findOne({
        user_id: cartData.user_id,
        branch_id: cartData.branch_id,
        product_id: cartData.product_id,
      });

      if (existingCartItem) {
        // If the cart item already exists, you can update its quantity here
        return res.status(StatusCodesConstants.SUCCESS).json({
          status: true,
          status_code: StatusCodesConstants.SUCCESS,
          message: MessageConstants.CART_ALREADY_EXIST,
          data: [],
        });
      }
  
      // Step 2: Check if the product exists in the database
      const productInfo = await models.BranchModel.BranchProduct.findOne({
        _id: cartData.product_id,
      });
      const branchInfo = await models.BranchModel.Branch.findOne({ 
        _id: cartData.branch_id 
      });
      

      if (productInfo) {
        // Step 3: Extract the price from the retrieved product information
        const productPrice = productInfo.branch_price;
  
        console.log(productInfo.branch_price)
        console.log(productPrice)

        // Step 4: Store the price and other cart data in the database
        const cartItem = {
          user_id: cartData.user_id,
          branch_id: cartData.branch_id,
          product_id: cartData.product_id,
          quantity: cartData.quantity,
          price: productPrice,
          total_price : cartData.total_price // Store the price in the cart item
        };
  
        const newCart = new models.BranchModel.Cart(cartItem);
        await newCart.save();
        
        // Create a new object with specific fields from product and branch
        const responseData = {
          product_id : newCart.product_id,
          product_name: productInfo.name,
          product_img: productInfo.image,
          price: newCart.price,
          quantity: newCart.quantity,
          coupon_discount: newCart.coupon_discount,
          delivery_fee: newCart.delivery_fee,
          total_price: newCart.total_price,
          branch: {
            branch_id: newCart.branch_id,
            branch_name: branchInfo.name,
          },
        }
        console.log(`User ${session.first_name} ${MessageConstants.CART_ADD_SUCCESSFULLY}`)
        return res.status(StatusCodesConstants.SUCCESS).json({
          status: true,
          status_code: StatusCodesConstants.SUCCESS,
          message: MessageConstants.CART_ADD_SUCCESSFULLY,
          data: responseData,
        });
      } else {
        return res.status(StatusCodesConstants.SUCCESS).json({
          status: true,
          status_code: StatusCodesConstants.SUCCESS,
          message: MessageConstants.PRODUCT_NOT_PRESENT,
          data: cartData,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return res
        .status(StatusCodesConstants.INTERNAL_SERVER_ERROR)
        .json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
    }
  },

  // Update Cart Data
  updateCartData: async (req, res) => {
    try {
      const session = req.user;
      const user_id = session.userId;
  
      console.log(`User ${session.first_name} updating Cart`)

      if (!user_id) {
        return res.status(StatusCodesConstants.ACCESS_DENIED).json({
          status: false,
          status_code: StatusCodesConstants.ACCESS_DENIED,
          message: MessageConstants.NOT_LOGGED_IN,
        });
      }
  
      const cartData = {
        user_id: session.userId,
        branch_id: req.body.branch,
        product_id: req.body.product,
        quantity: req.body.quantity,
        total_price: req.body.total_price,
      };
  
      const validationResult = Validator.validate(cartData, {
        branch_id: {
          presence : {allowEmpty :false},
        },
        product_id : {
          presence : {allowEmpty : false }
        },
        quantity: {
          presence: { allowEmpty: false },
          length: { minimum: 1, maximum: 100 },
        },
        total_price: {
          presence: { allowEmpty: false },
        },
      });
  
      if (validationResult) {
        return res.status(StatusCodesConstants.BAD_REQUEST).json({
          status: false,
          status_code: StatusCodesConstants.BAD_REQUEST,
          message: MessageConstants.VALIDATION_ERROR,
          data: validationResult,
        });
      }
  
      // Step 1: Check if there is already a cart item with the same user_id, branch_id, and product_id
      const existingCartItem = await models.BranchModel.Cart.findOne({
        user_id: cartData.user_id,
        branch_id: cartData.branch_id,
        product_id: cartData.product_id,
      });
  
      // If the cart item already exists, you can update its quantity here
      existingCartItem.quantity = cartData.quantity;
      existingCartItem.total_price = cartData.total_price; // Update the price as well if needed
      await existingCartItem.save();


      const productInfo = await models.BranchModel.BranchProduct.findOne({
        _id: cartData.product_id,
      });
      const branchInfo = await models.BranchModel.Branch.findOne({ 
        _id: cartData.branch_id 
      });

      const responseData = {
        product_id : existingCartItem.product_id,
        product_name: productInfo.name,
        product_img: productInfo.image,
        price: existingCartItem.price,
        quantity: existingCartItem.quantity,
        coupon_discount: existingCartItem.coupon_discount,
        delivery_fee: existingCartItem.delivery_fee,
        total_price: existingCartItem.total_price,
        branch: {
          branch_id: existingCartItem.branch_id,
          branch_name: branchInfo.name,
        },
      }

      console.log(`User ${session.first_name} ${MessageConstants.CART_UPDATE_SUCCESSFULLY}`)

      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: MessageConstants.CART_UPDATE_SUCCESSFULLY,
        data: responseData,
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
      return res
        .status(StatusCodesConstants.INTERNAL_SERVER_ERROR)
        .json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
    }
  },

  // Delete Cart Data
  deleteCartItem: async (req, res) => {
    try {
      const session = req.user;
      const user_id = session.userId;
      console.log(`User ${session.first_name} Deleting Cart`)
      if (!user_id) {
        return res.status(StatusCodesConstants.ACCESS_DENIED).json({
          status: false,
          status_code: StatusCodesConstants.ACCESS_DENIED,
          message: MessageConstants.NOT_LOGGED_IN,
        });
      }
  
      const cartData = {
        user_id: session.userId,
        product_id: req.body.product,
      };
  
      // Step 1: Check if the cart item exists
      const existingCartItem = await models.BranchModel.Cart.findOne({
        user_id: cartData.user_id,
        product_id: cartData.product_id,
      });
  
      if (!existingCartItem) {
        return res.status(StatusCodesConstants.NOT_FOUND).json({
          status: false,
          status_code: StatusCodesConstants.NOT_FOUND,
          message: MessageConstants.CART_ITEM_NOT_FOUND,
          data: cartData,
        });
      }
  
      // Step 2: Delete the cart item
      const deletedCartItem = await models.BranchModel.Cart.findOneAndRemove({
        user_id: cartData.user_id,
        product_id: cartData.product_id,
      });

      if (!deletedCartItem) {
        return res.status(StatusCodesConstants.NOT_FOUND).json({
          status: false,
          status_code: StatusCodesConstants.NOT_FOUND,
          message: MessageConstants.CART_ITEM_NOT_FOUND,
          data: cartData,
        });
      }
      console.log(`User ${session.first_name} ${MessageConstants.CART_DELETED}`)
      return res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: MessageConstants.CART_DELETED,
        data: deletedCartItem,
      });
    } catch (error) {
      console.error('Error deleting cart item:', error);
      return res
        .status(StatusCodesConstants.INTERNAL_SERVER_ERROR)
        .json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
    }
  },  
}  
  
  
  