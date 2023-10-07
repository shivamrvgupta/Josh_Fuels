const { MessageConstants, StatusCodesConstants } = require('../constants');
const { Validator } = require('../../../managers/utils');
const models = require('../../../managers/models');
  
module.exports = {
    // Get Order Data
        orderList: async (req, res) => {
            try {
                // Extract user session information
                const session = req.user;
                const user_id = session.userId;
        
                // Check if the user is logged in
                if (!user_id) {
                    return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                        status: false,
                        status_code: StatusCodesConstants.ACCESS_DENIED,
                        message: MessageConstants.NOT_LOGGED_IN,
                    });
                }
        
                // Query the database to fetch orders for the user
                const orders = await models.BranchModel.Order.find({
                    user_id: user_id,
                });
        
                // Check if any orders were found
                if (orders && orders.length > 0) {
                    const populatedOrder = [];
        
                    for (const order of orders) {
                        // Fetch product details for each order item
                        const productData = await Promise.all(order.product_items.map(async (product) => {
                            const productInfo = await models.BranchModel.BranchProduct.findOne({ _id: product.product_id });
                            if (productInfo) {
                                return {
                                    "product_id": product.product_id,
                                    "product_name": productInfo.name,
                                    "product_img": productInfo.image,
                                    "quantity": product.quantity,
                                    "price": product.price,
                                };
                            }
                            return null;
                        }));
        
                        // Fetch branch, delivery, and address details
                        const branchInfo = await models.BranchModel.Branch.findOne({ _id: order.branch_id });
                        const deliveryInfo = order.is_delivery_man_assigned
                            ? await models.UserModel.DeliveryMan.findOne({ _id: order.delivery_id })
                            : null;
                        const addressInfo = await models.UserModel.Address.findOne({ _id: order.address_id });
        
                        // Construct data objects
                        const addressData = {
                            address_id: addressInfo._id,
                            address_1: addressInfo.address_1,
                            area: addressInfo.area,
                            city: addressInfo.city,
                            state: addressInfo.state,
                        };
        
                        const branchData = {
                            branch_id: branchInfo._id,
                            branch_name: branchInfo.name,
                            branch_city: branchInfo.city,
                        };
        
                        const orderData = {
                            order_id: order.order_id,
                            coupon_discount: order.coupon_discount,
                            delivery_fee: order.delivery_fee,
                            total_price: order.total_price,
                            delivery_date: order.delivery_date,
                            delivery_time: order.delivery_time,
                            payment_method: order.payment_method,
                            note: order.note,
                            status: order.status,
                            grand_total: order.grand_total,
                        };
        
                        const deliveryManData = order.is_delivery_man_assigned
                            ? {
                                deliveryMan_id: deliveryInfo._id,
                                deliveryMan_name: deliveryInfo.name,
                            }
                            : {
                                deliveryMan_name: order.delivery_man,
                            };
        
                        // Construct the order item data
                        const orderItemData = {
                            ordered_address: addressData,
                            ordered_branch: branchData,
                            ordered_products: productData,
                            order_detail: orderData,
                            assigned_deliveryMan: deliveryManData,
                        };
        
                        populatedOrder.push(orderItemData);
                    }
        
                    console.log(`User ${session.first_name} ${MessageConstants.ORDER_FETCHED_SUCCESSFULLY}`);
                    return res.status(StatusCodesConstants.SUCCESS).json({
                        status: true,
                        status_code: StatusCodesConstants.SUCCESS,
                        message: MessageConstants.ORDER_FETCHED_SUCCESSFULLY,
                        data: {
                            orders: populatedOrder,
                        },
                    });
                } else {
                    // No orders found for the user
                    console.log("No orders found");
                    return res.status(StatusCodesConstants.SUCCESS).json({
                        status: true,
                        status_code: StatusCodesConstants.SUCCESS,
                        message: MessageConstants.ORDER_NOT_FOUND,
                        data: {
                            orders: [],
                        },
                    });
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
            }
        },
    
    // Get Order Data
        perOrder: async (req, res) => {
            try {
                // Extract user session information
                const session = req.user;
                const user_id = session.userId;
                const order_id = req.body.order_id;
        
                // Check if the user is logged in
                if (!user_id) {
                    return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                        status: false,
                        status_code: StatusCodesConstants.ACCESS_DENIED,
                        message: MessageConstants.NOT_LOGGED_IN,
                    });
                }
        
                // Query the database to fetch orders for the user
                const orders = await models.BranchModel.Order.find({
                    user_id: user_id,
                    order_id : order_id
                });
        
                // Check if any orders were found
                if (orders && orders.length > 0) {
                    const populatedOrder = [];
        
                    for (const order of orders) {
                        // Fetch product details for each order item
                        const productData = await Promise.all(order.product_items.map(async (product) => {
                            const productInfo = await models.BranchModel.BranchProduct.findOne({ _id: product.product_id });
                            if (productInfo) {
                                return {
                                    "product_id": product.product_id,
                                    "product_name": productInfo.name,
                                    "product_img": productInfo.image,
                                    "quantity": product.quantity,
                                    "price": product.price,
                                };
                            }
                            return null;
                        }));
        
                        // Fetch branch, delivery, and address details
                        const branchInfo = await models.BranchModel.Branch.findOne({ _id: order.branch_id });
                        const deliveryInfo = order.is_delivery_man_assigned
                            ? await models.UserModel.DeliveryMan.findOne({ _id: order.delivery_id })
                            : null;
                        const addressInfo = await models.UserModel.Address.findOne({ _id: order.address_id });
        
                        // Construct data objects
                        const addressData = {
                            address_id: addressInfo._id,
                            address_1: addressInfo.address_1,
                            area: addressInfo.area,
                            city: addressInfo.city,
                            state: addressInfo.state,
                        };
        
                        const branchData = {
                            branch_id: branchInfo._id,
                            branch_name: branchInfo.name,
                            branch_city: branchInfo.city,
                        };
        
                        const orderData = {
                            order_id: order.order_id,
                            coupon_discount: order.coupon_discount,
                            delivery_fee: order.delivery_fee,
                            total_price: order.total_price,
                            delivery_date: order.delivery_date,
                            delivery_time: order.delivery_time,
                            payment_method: order.payment_method,
                            note: order.note,
                            status: order.status,
                            grand_total: order.grand_total,
                        };
        
                        const deliveryManData = order.is_delivery_man_assigned
                            ? {
                                deliveryMan_id: deliveryInfo._id,
                                deliveryMan_name: deliveryInfo.name,
                            }
                            : {
                                deliveryMan_name: order.delivery_man,
                            };
        
                        // Construct the order item data
                        const orderItemData = {
                            ordered_address: addressData,
                            ordered_branch: branchData,
                            ordered_products: productData,
                            order_detail: orderData,
                            assigned_deliveryMan: deliveryManData,
                        };
        
                        populatedOrder.push(orderItemData);
                    }
        
                    console.log(`User ${session.first_name} ${MessageConstants.ORDER_FETCHED_SUCCESSFULLY}`);
                    return res.status(StatusCodesConstants.SUCCESS).json({
                        status: true,
                        status_code: StatusCodesConstants.SUCCESS,
                        message: MessageConstants.ORDER_FETCHED_SUCCESSFULLY,
                        data: {
                            orders: populatedOrder,
                        },
                    });
                } else {
                    // No orders found for the user
                    console.log("No orders found");
                    return res.status(StatusCodesConstants.SUCCESS).json({
                        status: true,
                        status_code: StatusCodesConstants.SUCCESS,
                        message: MessageConstants.ORDER_NOT_FOUND,
                        data: {
                            orders: [],
                        },
                    });
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
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
                    _id: orderData.cart_id,
                });
                console.log(cartInfo);
                
                const addressInfo = await models.UserModel.Address.findOne({
                    _id: orderData.address_id,
                    user_id: user_id,
                });
                
                const branchInfo = await models.BranchModel.Branch.findOne({
                    _id: cartInfo.branch_id,
                });
                
                const lastOrder = await models.BranchModel.Order.findOne({}, {}, { sort: { 'order_id': -1 } }).exec();
                
                let nextOrderId = 100001;
                
                if (lastOrder) {
                    nextOrderId = Number(lastOrder.order_id) + 1;
                }

                console.log(branchInfo.name);
                
                const products = cartInfo.product_items;
                
                if (products && products.length !== 0) {
                    const populatedCart = [];
                
                    // Iterate through each product item in the cart
                    for (const product of products) {
                        // Manually populate the product and branch details from the referenced models
                        const productInfo = await models.BranchModel.BranchProduct.findOne({ _id: product.product_id });
                        if (productInfo) {
                            const productData = {
                                products: [
                                    {
                                        "product_id": product.product_id,
                                        "product_name": productInfo.name,
                                        "product_img": productInfo.image,
                                        "quantity": product.quantity,
                                        "price": product.price,
                                        "_id": product._id,
                                    },
                                ],
                            };
                
                            populatedCart.push(productData);
                        }
                    }

                    const existingOrder = await models.BranchModel.Order.findOne({
                        user_id: session.userId,
                        branch_id: cartInfo.branch_id,
                        product_items: { $eq: cartInfo.product_items }, // Compare the product_items array
                        status: "Pending",
                    });
            
                    if (existingOrder) {
                        // If an existing order is found, return an error response
                        console.log("iam here");
                        return res.status(StatusCodesConstants.SUCCESS).json({
                            status: true,
                            status_code: StatusCodesConstants.SUCCESS,
                            message: MessageConstants.ORDER_ALREADY_REGISTERED,
                            data : existingOrder,
                        });
                    }

                    const orderItem = {
                        order_id : nextOrderId,
                        user_id : session.userId,
                        branch_id : cartInfo.branch_id,    
                        product_items : cartInfo.product_items,
                        address_id: orderData.address_id, 
                        coupon_discount : orderData.coupon_discount,    
                        delivery_fee : orderData.delivery_fee,    
                        total_price : orderData.total_price,    
                        delivery_date : orderData.delivery_date,
                        delivery_time : orderData.delivery_time,
                        payment_method : orderData.payment_method,
                        note : orderData.note,
                        status : "Pending",
                        delivery_man : "Not Assigned Yet",
                        grand_total : orderData.grand_total
                    };
                    const newOrder = new models.BranchModel.Order(orderItem);
                    await newOrder.save();

                    // Delete the cart after successfully adding the order
                    await models.BranchModel.Cart.deleteOne({ _id: orderData.cart_id });

                    const deliveryInfo = newOrder.is_delivery_man_assigned
                    ? await models.UserModel.DeliveryMan.findOne({ _id: order.delivery_id })
                    : null;

                    const deliveryManData = newOrder.is_delivery_man_assigned
                    ? {
                        deliveryMan_id: deliveryInfo._id,
                        deliveryMan_name: deliveryInfo.name,
                    }
                    : {
                        deliveryMan_name: orderData.delivery_man,
                    };


                    const orderDetails = {
                        order_id : orderData.order_id,
                        coupon_discount : orderData.coupon_discount,    
                        delivery_fee : orderData.delivery_fee,    
                        total_price : orderData.total_price,    
                        delivery_date : orderData.delivery_date,
                        delivery_time : orderData.delivery_time,
                        payment_method : orderData.payment_method,
                        note : orderData.note,
                        grand_total : orderData.grand_total,
                        status : orderItem.status,
                        delivery_man : orderItem.delivery_man,
                    }
                    

                    const addressInfo = await models.UserModel.Address.findOne({ _id: orderData.address_id });
        
                    // Construct data objects
                    const addressData = {
                        address_id: addressInfo._id,
                        address_1: addressInfo.address_1,
                        area: addressInfo.area,
                        city: addressInfo.city,
                        state: addressInfo.state,
                    };
    
                    const userData = {
                        first_name: session.first_name,
                        last_name: session.last_name,
                        phone: session.phone,
                        email: session.email,
                    };
    
                    const branchData = {
                        branch_id: branchInfo._id,
                        branch_name: branchInfo.name,
                        branch_city: branchInfo.city,
                    };

                    const orderItems = {
                        user: userData,
                        address: addressData,
                        branch: branchData,
                        userData : userData ,
                        cartData: populatedCart,
                        orderData : orderDetails,
                        deliveryInfo : deliveryManData
                    };



                    console.log(`User ${session.first_name} ${MessageConstants.ORDER_ADD_SUCCESSFULLY} and ${orderData.cart_id} Deleted SuccessFully`)
                    return res.status(StatusCodesConstants.SUCCESS).json({
                        status: true,
                        status_code: StatusCodesConstants.SUCCESS,
                        message: MessageConstants.ORDER_ADD_SUCCESSFULLY,
                        data: {
                            order : orderItems
                        },
                    });
                }else{
                return res.status(StatusCodesConstants.SUCCESS).json({
                    status: true,
                    status_code: StatusCodesConstants.SUCCESS,
                    message: MessageConstants.CART_EMPTY,
                    data: {
                        cartData: [],
                    },
                });
                }
            }catch(error){
                console.error('Error fetching data:', error);
                return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
            }
        },

    // Update Order Data
        updateOrder: async (req, res) => {
            try {
                const session = req.user;
                const user_id = session.userId;
        
                console.log(`User ${session.first_name} Fetching Order Data -- Update Order`);
        
                if (!user_id) {
                    return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                        status: false,
                        status_code: StatusCodesConstants.ACCESS_DENIED,
                        message: MessageConstants.NOT_LOGGED_IN,
                    });
                }
        
                const updateData = {
                    user_id: user_id,
                    order_id: req.body.order_id,
                    product_id: req.body.product_id,
                    quantity: req.body.quantity,
                    total_price: req.body.total_price,
                    grand_total: req.body.grand_total,
                };
        
                const validationResult = Validator.validate(updateData, {
                    order_id: {
                        presence: { allowEmpty: false },
                        length: { minimum: 3 }
                    },
                    product_id: {
                        presence: { allowEmpty: false }
                    },
                    quantity: {
                        presence: { allowEmpty: false },
                    },
                    total_price: {
                        presence: { allowEmpty: false },
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
        
                const existingOrder = await models.BranchModel.Order.findOne({
                    order_id: updateData.order_id,
                    user_id: user_id
                });
        
                if (existingOrder) {
                    // Find the product index within the existing order
                    const productIndex = existingOrder.product_items.findIndex((item) => {
                        return item.product_id.toString() === updateData.product_id.toString();
                    });
        
                    if (productIndex !== -1) {
                        // Update product details
                        existingOrder.product_items[productIndex].quantity = updateData.quantity;
                        existingOrder.total_price = updateData.total_price;
                        existingOrder.product_items[productIndex].grand_total = updateData.grand_total;
        
                        await existingOrder.save();


                        console.log(`User ${session.first_name} ${MessageConstants.CART_UPDATE_SUCCESSFULLY}`);
                        return res.status(StatusCodesConstants.SUCCESS).json({
                            status: true,
                            status_code: StatusCodesConstants.SUCCESS,
                            message: MessageConstants.PRODUCT_UPDATE_SUCCESSFULLY,
                            data: existingOrder, // Return the updated order
                        });
                    } else {
                        console.log(`Product not found in the order`);
                        return res.status(StatusCodesConstants.NOT_FOUND).json({
                            status: false,
                            status_code: StatusCodesConstants.NOT_FOUND,
                            message: MessageConstants.PRODUCT_NOT_FOUND_IN_ORDER,
                        });
                    }
                } else {
                    console.log(`Order not found for the user`);
                    return res.status(StatusCodesConstants.NOT_FOUND).json({
                        status: false,
                        status_code: StatusCodesConstants.NOT_FOUND,
                        message: MessageConstants.ORDER_NOT_FOUND,
                    });
                }
            } catch (error) {
                console.error('Error updating order:', error);
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
                  return res.status(StatusCodesConstants.SUCCESS).json({
                    status: false,
                    status_code: StatusCodesConstants.SUCCESS,
                    message: MessageConstants.ORDER_NOT_FOUND,
                    data : []
                  });
                }
            
                if (order.status === "Cancelled") {
                    // Condition 2: If the order status is "Cancelled"                
                    return res.status(StatusCodesConstants.SUCCESS).json({
                        status: true,
                        status_code: StatusCodesConstants.SUCCESS,
                        message: MessageConstants.ORDER_ALREADY_Cancelled,
                        data : {
                            order : []
                        }
                    });
                } else if (order.status === "Returned" || order.status === "Failed" || order.status === "Delivered" || order.status === "Out For Delivery") {                
                    const message = `${MessageConstants.ORDER_NOT_DELETE} --- cause ${order.status} `
                    return res.status(StatusCodesConstants.SUCCESS).json({
                        status: true,
                        status_code: StatusCodesConstants.SUCCESS,
                        message: MessageConstants.ORDER_NOT_DELETE,
                        data : message
                    });
                } else {
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
                    data : order
                    });
                }
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
  
  
  