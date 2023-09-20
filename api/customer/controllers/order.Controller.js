const { MessageConstants, StatusCodesConstants } = require('../constants');
const { Validator } = require('../utils');
const models = require('../models');
  
module.exports = {
    // Get Order Data
        orderList: async (req, res) => {
            try {
            const session = req.user;
            user_id = session.userId;
        
            console.log(`User ${session.first_name} Fetching Order Data`);
        
            if (!user_id) {
                return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                    status: false,
                    status_code: StatusCodesConstants.ACCESS_DENIED,
                    message: MessageConstants.NOT_LOGGED_IN,
                });
            }
        
            // Fetch user's orders based on the session's user_id
            const orders = await models.BranchModel.Order.find({ user_id: session.userId });

            const orderCount = orders.length;
        
            if (!orders || orders.length === 0) {
                console.log(`User ${session.first_name}, ${MessageConstants.ORDER_FETCHED_SUCCESSFULLY}, ${MessageConstants.ORDER_NOT_PRESENT}`);
                return res.status(StatusCodesConstants.SUCCESS).json({
                status: true,
                status_code: StatusCodesConstants.SUCCESS,
                message: MessageConstants.ORDER_NOT_FOUND,
                data: {
                    orderCount: orderCount,
                    orderData: [],
                },
                });
            } else {
                const populatedOrders = []; // Initialize an array to store all orders
        
                // Iterate through each order
                for (const orderItem of orders) {
                // Manually populate the product and branch details from the referenced models
                const productInfo = await models.BranchModel.BranchProduct.findOne({ _id: orderItem.product_id });
                const branchInfo = await models.BranchModel.Branch.findOne({ _id: orderItem.branch_id });
                const addressInfo = await models.UserModel.Address.findOne({ _id: orderItem.address_id, user_id: user_id });
        
                if (productInfo && branchInfo && addressInfo) {
                    // Create a new object with specific fields from product, branch, and order
                    const orderItemData = {
                    user_data: {
                        first_name: session.first_name,
                        last_name: session.last_name,
                        email: session.email,
                        phone: session.phone,
                    },
                    product_data: {
                        image: productInfo.image,
                        name: productInfo.name,
                        price: productInfo.price,
                        quantity: orderItem.quantity,
                        total_price: orderItem.total_price,
                        coupon_discount: orderItem.coupon_discount,
                        delivery_fee: orderItem.delivery_fee,
                        grand_total: orderItem.grand_total,
                    },
                    order_data: {
                        order_id: orderItem.order_id,
                        payment_method: orderItem.payment_method,
                        delivery_man: orderItem.delivery_man,
                        delivery_date: orderItem.delivery_date,
                        delivery_time: orderItem.delivery_time,
                        note: orderItem.note,
                        status: orderItem.status,
                        is_scheduled_for_later: orderItem.is_scheduled_for_later,
                        is_delivery_man_assigned: orderItem.is_delivery_man_assigned,
                        estimated_delivery_time: orderItem.estimated_delivery_time,
                        created_date: orderItem.created_date,
                    },
                    branch_data: {
                        branch_name: branchInfo.name,
                        branch_city: branchInfo.city,
                    },
                    address: {
                        address_type: addressInfo.address_type,
                        address_1: addressInfo.address_1,
                        address_2: addressInfo.address_2,
                        area: addressInfo.area,
                        city: addressInfo.city,
                        pincode: addressInfo.pincode,
                        state: addressInfo.state,
                        country: addressInfo.country,
                    },
                    };
        
                    populatedOrders.push(orderItemData);
                }
                }
        
                console.log(`User ${session.first_name} ${MessageConstants.ORDER_FETCHED_SUCCESSFULLY}`);
                return res.status(StatusCodesConstants.SUCCESS).json({
                status: true,
                status_code: StatusCodesConstants.SUCCESS,
                message: MessageConstants.ORDER_FETCHED_SUCCESSFULLY,
                data: {
                    orderCount: orderCount,
                    orderData: populatedOrders, // Send the array of populated orders
                },
                });
            }
            } catch (error) {
            console.error('Error fetching data:', error);
            return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
            }
        },
      

    // Add Order Data
        addOrder : async (req, res) => {
            try {
                const session = req.user;
                user_id = session.userId;
    
                console.log(`User ${session.first_name} Fetching Order Data`)
    
                if(!user_id){
                    return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                    status: false,
                    status_code: StatusCodesConstants.ACCESS_DENIED,
                    message: MessageConstants.NOT_LOGGED_IN,
                    })
                }

                const orderData = {
                    user_id : user_id,
                    address_id : req.body.address_id,
                    cart_id : req.body.cart_id,
                    coupon_discount : req.body.coupon_discount,    
                    total_price : req.body.total_price,    
                    delivery_fee : req.body.delivery_fee,    
                    delivery_date : req.body.delivery_date,
                    delivery_time : req.body.delivery_time,
                    payment_method : req.body.payment_method,
                    note : req.body.note ,
                    grand_total : req.body.grand_total,
                        
                }
                
                const validationResult = Validator.validate(orderData, {
                    address_id: {
                      presence : {allowEmpty :false},
                    },
                    cart_id : {
                      presence : {allowEmpty : false }
                    },
                    total_price : {
                      presence : {allowEmpty : false }
                    },
                    coupon_discount : {
                      presence : {allowEmpty : false }
                    },
                    payment_method: {
                        presence: { allowEmpty: false }, 
                        length: { minimum: 3, maximum: 100 },
                    },
                    delivery_fee: {
                      presence: { allowEmpty: false },
                    },
                    delivery_date: {
                      presence: { allowEmpty: false },
                      length: { minimum: 3, maximum: 100 },
                    },
                    delivery_time: {
                      presence: { allowEmpty: false }, 
                      length: { minimum: 3, maximum: 100 },
                    },
                    note: {
                      presence: { allowEmpty: false }, 
                      length: { minimum: 3, maximum: 200 },
                    },
                    grand_total: {
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

                const cartInfo = await models.BranchModel.Cart.findOne({
                    _id : orderData.cart_id,
                });
                console.log(cartInfo);

                const productInfo = await models.BranchModel.BranchProduct.findOne({
                    _id : cartInfo.product_id,
                });
                
                const addressInfo = await models.UserModel.Address.findOne({
                    _id : orderData.address_id,
                    user_id : user_id   
                });

                const lastOrder = await models.BranchModel.Order.findOne({}, {}, { sort: { 'order_id': -1 } }).exec();

                let nextOrderId = 100001;

                if (lastOrder) {
                    nextOrderId = Number(lastOrder.order_id) + 1;
                }

                const orderItem = {
                    order_id : nextOrderId,
                    first_name : session.first_name,
                    last_name : session.last_name,
                    product_name : productInfo.name,                   
                    branch_id : cartInfo.branch_id,    
                    quantity : cartInfo.quantity,    
                    address_1: addressInfo.address_1, 
                    coupon_discount : cartInfo.coupon_discount,    
                    delivery_fee : cartInfo.delivery_fee,    
                    total_price : cartInfo.total_price,    
                    delivery_date : orderData.delivery_date,
                    delivery_time : orderData.delivery_time,
                    payment_method : orderData.payment_method,
                    note : orderData.note,
                    grand_total : orderData.grand_total
                }

                const newOrder = new models.BranchModel.Order(orderItem);
                await newOrder.save();

                const deleteCart = await models.BranchModel.Cart.findOneAndRemove({
                    user_id: orderItem.user_id,
                    product_id: orderItem.product_id,
                    _id : orderData.cart_id
                });

                console.log(`Cart Data ${deleteCart} moved to order and order placed`)

                console.log(`User ${session.first_name} --- ${MessageConstants.ORDER_ADD_SUCCESSFULLY}`)
                return res.status(StatusCodesConstants.SUCCESS).json({
                  status: true,
                  status_code: StatusCodesConstants.SUCCESS,
                  message: MessageConstants.ORDER_ADD_SUCCESSFULLY,
                  data: orderItem,
                });
            }catch(error){
                console.error('Error fetching data:', error);
                return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
            }
        },

    // Update Order Data
        updateOrder : async (req, res) => {
            try {
                const session = req.user;
                user_id = session.userId;

                console.log(`User ${session.first_name} Fetching Order Data -- Update Order`)

                if(!user_id){
                    return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                    status: false,
                    status_code: StatusCodesConstants.ACCESS_DENIED,
                    message: MessageConstants.NOT_LOGGED_IN,
                    })
                }

                const updateData = {
                    order_id : req.body.order_id,
                    quantity : req.body.quantity,
                    price : req.body.price,
                    total_price : req.body.total_price,
                    grand_total: req.body.grand_total
                }
                
                const validationResult = Validator.validate(updateData, {
                    order_id: {
                        presence : {allowEmpty :false},
                        length : {minimum:3}
                    },
                    quantity: {
                        presence: { allowEmpty: false }, 
                        length : {minimum:1}
                    },
                    price: {
                        presence: { allowEmpty: false }, 
                        length : {minimum:1}
                    },
                    total_price: {
                        presence: { allowEmpty: false }, 
                        length : {minimum:1}
                    },
                    grand_total: {
                        presence: { allowEmpty: false }, 
                        length : {minimum:1}
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
                
                const order = await models.BranchModel.Order.findOne({ _id: order_id , user_id : user_id });
                console.log(order);


                const updateOrder = new models.BranchModel.Order(updateData);
                await updateOrder.save();


                console.log(`Cart Data ${deleteCart} moved to order and order placed`)

                console.log(`User ${session.first_name} --- ${MessageConstants.ORDER_ADD_SUCCESSFULLY}`)
                return res.status(StatusCodesConstants.SUCCESS).json({
                status: true,
                status_code: StatusCodesConstants.SUCCESS,
                message: MessageConstants.ORDER_ADD_SUCCESSFULLY,
                data: orderItem,
                });
            }catch(error){
                console.error('Error fetching data:', error);
                return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
            }
        },


    // Delete API 
        deleteOrder : async (req, res) => {
            try {
                const session = req.user;
                user_id = session.userId;
    
                console.log(`User ${session.first_name} Fetching Order Data`)
    
                if(!user_id){
                    return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                    status: false,
                    status_code: StatusCodesConstants.ACCESS_DENIED,
                    message: MessageConstants.NOT_LOGGED_IN,
                    })
                }


                const orderId = req.body.order_id;
            
                // Locate the order by its ID
                const order = await models.BranchModel.Order.findOne(
                    { 
                        order_id: orderId,
                        user_id : user_id,
                    });
            
                if (!order) {
                  return res.status(StatusCodesConstants.NOT_FOUND).json({
                    status: false,
                    status_code: StatusCodesConstants.SUCCESS,
                    message: MessageConstants.ORDER_NOT_FOUND,
                    data : []
                  });
                }
            
                // Update the order's status to "cancel" (or any desired status)
                order.status = 'Cancelled'; // Update to your desired status
                order.is_cancelled = true
            
                // Save the updated order
                await order.save();
            
                console.log(`Order ${orderId} has been canceled by ${session.first_name, session.last_name}.`);
            
                return res.status(StatusCodesConstants.SUCCESS).json({
                  status: true,
                  status_code: StatusCodesConstants.SUCCESS,
                  message: MessageConstants.ORDER_DELETED,
                });
              } catch (error) {
                console.error('Error canceling order:', error);
                return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
                  status: false,
                  status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
                  message: MessageConstants.INTERNAL_SERVER_ERROR,
                });
              }
        }
}  
  
  
  