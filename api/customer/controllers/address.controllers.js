const {
  MessageConstants,
  StatusCodesConstants,
} = require('../constants');
const { Validator} = require('../../../managers/utils');
const models = require('../../../managers/models');

// This would be your token blacklist storage
const tokenBlacklist = new Set();



module.exports = {
    // Add Address
        addAddress : async (req, res) => {
            try { 
            const user = req.user;
            user_id = user.userId;
            if(!user_id){
                return res.status(StatusCodesConstants.BAD_REQUEST).json({
                status: false,
                status_code: StatusCodesConstants.BAD_REQUEST,
                message: NOT_LOGGED_IN,
                });
            }

            const addAddress = {
                user_id: user_id,
                address_type: req.body.address_type,
                address_1: req.body.address_1,
                address_2: req.body.address_2,
                area: req.body.area,
                city: req.body.city,
                pincode: req.body.pincode,
                state: req.body.state,
                country: req.body.country,
            }

            const validationResult = Validator.validate(addAddress, {
                address_type: {
                presence: { allowEmpty: false },
                length: { minimum: 4, maximum: 20 },
                },
                address_1: {
                presence: { allowEmpty: false },
                length: { minimum: 10, maximum: 150 },
                },
                area: {
                presence: { allowEmpty: false },
                length: { minimum: 4, maximum: 50 },
                },
                city: {
                presence: { allowEmpty: false },
                length: { minimum: 4, maximum: 50 },
                },
                state: {
                presence: { allowEmpty: false },
                length: { minimum: 4, maximum: 50 },
                },
                country: {
                presence: { allowEmpty: false },
                length: { minimum: 4, maximum: 50 },
                },
                pincode:{
                presence: { allowEmpty: false },
                numericality: { onlyInteger: true },
                length: { minimum: 3, maximum: 6 },
                },
            })

            if (validationResult) {
                return res.status(StatusCodesConstants.BAD_REQUEST).json({
                status: false,
                status_code: StatusCodesConstants.BAD_REQUEST,
                message: MessageConstants.VALIDATION_ERROR,
                data: validationResult, // Include the validation result in the response if needed
                });
            }

            const newAddress = new models.UserModel.Address(addAddress);
            const savedAddress = await newAddress.save();
            console.log("Saved Address  --", savedAddress)
            // Update the user's data (is_address_available: true)
            await models.UserModel.User.findOneAndUpdate(
                { _id: user_id },
                { is_address_available: true }
            );

            console.log(models.UserModel.User.findOneAndUpdate(
                { _id: user_id },
                { is_address_available: true }))

            console.log(`User ${user_id} updated successfully`)
            
            console.log("Address Added SuccessFully")
            return res.status(StatusCodesConstants.SUCCESS).json({
                status: true,
                status_code: StatusCodesConstants.SUCCESS,
                message: 'Address added successfully',
                data: { address: savedAddress },
            });
            } catch (error) {
            console.error(error);
            return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
                status: false,
                status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
                message: MessageConstants.INTERNAL_SERVER_ERROR,
            });
            }
        },

    // Get Address
        getAddress: async (req, res) => {
            try {
            const user = req.user;
            const user_id = user.userId;
        
            if (!user_id) {
                return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                status: false,
                status_code: StatusCodesConstants.ACCESS_DENIED,
                message: MessageConstants.NOT_LOGGED_IN,
                });
            }
        
            // Find addresses for the user
            const addresses = await models.UserModel.Address.find({ user_id });
        
            if(addresses){
                return res.status(StatusCodesConstants.SUCCESS).json({
                    status: true,
                    status_code: StatusCodesConstants.SUCCESS,
                    message: MessageConstants.ADDRESS_FETCHED_SUCCESSFULLY,
                    data: addresses,
                });
            }else{
                return res.status(StatusCodesConstants.NOT_FOUND).json({
                    status: false,
                    status_code: StatusCodesConstants.NOT_FOUND,
                    message: MessageConstants.ADDRESS_NOT_PRESENT,
                    data: [],
                });
            }
            } catch (error) {
            console.error(error);
            return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({
                status: false,
                status_code: StatusCodesConstants.INTERNAL_SERVER_ERROR,
                message: MessageConstants.INTERNAL_SERVER_ERROR,
            });
            }
        },

    // Update Address
    updateAddress: async (req, res) => {
        try {
            const session = req.user;
            const user_id = session.userId;
        
            console.log(`User ${session.first_name} updating address`)
      
            if (!user_id) {
              return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                status: false,
                status_code: StatusCodesConstants.ACCESS_DENIED,
                message: MessageConstants.NOT_LOGGED_IN,
              });
            }
    
            const addressData = {
                user_id: user_id,
                address_id: req.body.address_id,
                address_type: req.body.address_type,
                address_1: req.body.address_1,
                address_2: req.body.address_2,
                area: req.body.area,
                city: req.body.city,
                pincode: req.body.pincode,
                state: req.body.state,
                country: req.body.country,
            }

            const validationResult = Validator.validate(addressData, {
                address_id: {
                    presence: { allowEmpty: false },
                },
                address_type: {
                    presence: { allowEmpty: false },
                    length: { minimum: 4, maximum: 20 },
                },
                address_1: {
                    presence: { allowEmpty: false },
                    length: { minimum: 10, maximum: 150 },
                },
                area: {
                    presence: { allowEmpty: false },
                    length: { minimum: 4, maximum: 50 },
                },
                city: {
                    presence: { allowEmpty: false },
                    length: { minimum: 4, maximum: 50 },
                },
                state: {
                    presence: { allowEmpty: false },
                    length: { minimum: 4, maximum: 50 },
                },
                country: {
                    presence: { allowEmpty: false },
                    length: { minimum: 4, maximum: 50 },
                },
                pincode:{
                    presence: { allowEmpty: false },
                    numericality: { onlyInteger: true },
                    length: { minimum: 3, maximum: 6 },
                },
            })

            if (validationResult) {
                return res.status(StatusCodesConstants.BAD_REQUEST).json({
                status: false,
                status_code: StatusCodesConstants.BAD_REQUEST,
                message: MessageConstants.VALIDATION_ERROR,
                data: validationResult, // Include the validation result in the response if needed
                });
            }

            // Step 1: Check if there is already a address item with the same user_id, branch_id, and product_id
            const existingAddress = await models.UserModel.Address.findOne({
                _id : addressData.address_id,
                user_id: addressData.user_id,
            });

            if(existingAddress){
                // If the address item already exists, you can update its quantity here
                existingAddress.address_type = req.body.address_type || existingAddress.address_type;
                existingAddress.address_1 = req.body.address_1 || existingAddress.address_1;
                existingAddress.address_2 = req.body.address_2 || existingAddress.address_2;
                existingAddress.area = req.body.area || existingAddress.area;
                existingAddress.city = req.body.city || existingAddress.city;
                existingAddress.pincode = req.body.pincode || existingAddress.pincode;
                existingAddress.state = req.body.state || existingAddress.state;
                existingAddress.country = req.body.country || existingAddress.country;

                await existingAddress.save();

                return res.status(StatusCodesConstants.SUCCESS).json({
                    status: true,
                    status_code: StatusCodesConstants.SUCCESS,
                    message: MessageConstants.ADDRESS_UDPATED_SUCCESSFULLY,
                    data: { address : existingAddress },
                });
            }else{
                return res.status(StatusCodesConstants.NOT_FOUND).json({
                    status: true,
                    status_code: StatusCodesConstants.NOT_FOUND,
                    message: MessageConstants.ADDRESS_NOT_PRESENT,
                    data: []
                });
            }
        } catch (error) {
          console.error(error);
          return res.status(500).json({
            status: false,
            status_code: 500,
            message: 'Internal server error',
          });
        }
      },

    // Delete Address
        deleteAddress: async (req, res) => {
            try {
            const session = req.user;
            const user_id = session.userId;
            console.log(`User ${session.first_name} ----- Deleting Address`)
            if (!user_id) {
                return res.status(StatusCodesConstants.ACCESS_DENIED).json({
                status: false,
                status_code: StatusCodesConstants.ACCESS_DENIED,
                message: MessageConstants.NOT_LOGGED_IN,
                });
            }
        
            const addressData = {
                user_id: session.userId,
                address_id: req.body.address_id,
            };
        
            // Step 1: Check if the address item exists
            const existingAddress = await models.UserModel.Address.findOne({
                user_id: addressData.user_id,
                _id: addressData.address_id,
            });
        
            if (!existingAddress) {
                return res.status(StatusCodesConstants.NOT_FOUND).json({
                status: false,
                status_code: StatusCodesConstants.NOT_FOUND,
                message: MessageConstants.ADDRESS_NOT_PRESENT,
                data: [],
                });
            }
        
            // Step 2: Delete the address item
            const deletedAddress = await models.UserModel.Address.findOneAndRemove({
                user_id: addressData.user_id,
                _id: addressData.address_id,
            });
        
            console.log(`User ${session.first_name} ---- ${MessageConstants.ADDRESS_DELETED_SUCCESSFULLY}`)
            return res.status(StatusCodesConstants.SUCCESS).json({
                status: true,
                status_code: StatusCodesConstants.SUCCESS,
                message: MessageConstants.ADDRESS_DELETED_SUCCESSFULLY,
                data: {address : deletedAddress},
            });
            } catch (error) {
            console.error('Error deleting address item:', error);
            return res
                .status(StatusCodesConstants.INTERNAL_SERVER_ERROR)
                .json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
            }
        },  
            

}


