const {
  MessageConstants,
  StatusCodesConstants,
  
} = require('../constants');
const { AuthMiddleware } = require('../middlewares');
const { Validator, ApiError } = require('../../../managers/utils');
const { generateAccessToken } = require('../middlewares/auth.middleware');
const models = require('../../../managers/models');



module.exports = {
// Get Nearest branch
  getNearestBranch : async (req, res) => {
    try {
      const session = req.user;
      user_id = session.userId;
      if(!user_id){
        return res.status(StatusCodesConstants.ACCESS_DENIED).json({
          status: false,
          status_code: StatusCodesConstants.ACCESS_DENIED,
          message: MessageConstants.NOT_LOGGED_IN,
        })
      }

      // Fetch user's city based on the sessions user_id
      const user_city = await models.UserModel.Address.findOne({ user_id: user_id });

      console.log(user_city.city);

      const branchesInCity = await models.BranchModel.Branch.find({ city: user_city.city });

      console.log(branchesInCity);

      if (!branchesInCity || branchesInCity.length === 0) {
        return res.status(StatusCodesConstants.NOT_FOUND).json({ 
          status: true,
          status_code: StatusCodesConstants.NOT_FOUND,
          message: MessageConstants.BRANCH_NOT_IN_AREA,
         });
      }

      res.status(StatusCodesConstants.SUCCESS).json({
        status: true,
        status_code: StatusCodesConstants.SUCCESS,
        message: MessageConstants.BRANCH_FETCHED_SUCCESSFULLY,
        data: branchesInCity,
      });
  } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
  }
  },

// Get Branch Products
  branchProducts : async (req, res) => {
    try {
      const session = req.user;
      user_id = session.userId;
      if(!user_id){
        return res.status(StatusCodesConstants.ACCESS_DENIED).json({
          status: false,
          status_code: StatusCodesConstants.ACCESS_DENIED,
          message: MessageConstants.NOT_LOGGED_IN,
        })
      }

      // Fetch user's city based on the sessions user_id
      const user_city = await models.UserModel.Address.findOne({ user_id: user_id });

      const user = await models.UserModel.User.findOne({ _id: user_id})

      console.log(user_city.city);

      const branchesInCity = await models.BranchModel.Branch.find({ city: user_city.city });

      console.log(branchesInCity);

      if (!branchesInCity || branchesInCity.length === 0) {
        return res.status(StatusCodesConstants.SUCCESS).json({ 
          status: true,
          status_code: StatusCodesConstants.SUCCESS,
          message: MessageConstants.BRANCH_NOT_IN_AREA,
          data : []
         });
      }

      const branchIds = branchesInCity.map(branch => branch._id);

      console.log("This is Branch Ids",branchIds)
  

      // Fetch products available in the branches of the user's city
      const productsData = await models.BranchModel.BranchProduct.find({ branch: branchIds[0] , is_selling : true});

      console.log(user)


      if(user.is_privilaged == true){
        const responseData = {
          productsData : productsData,
          customer_price : user.fixed_price
        }
        if(!productsData || productsData.length === 0){
          return res.status(StatusCodesConstants.NOT_FOUND).json({
            status: true,
            status_code: StatusCodesConstants.NOT_FOUND,
            message: MessageConstants.PRODUCT_NOT_PRESENT,
            data: [],
          });
        }else{
          return res.status(StatusCodesConstants.SUCCESS).json({
            status: true,
            status_code: StatusCodesConstants.SUCCESS,
            message: MessageConstants.PRODUCT_FETCHED_SUCCESSFULLY,
            data: responseData,
          });
        }
      }


      if(!productsData || productsData.length === 0){
        return res.status(StatusCodesConstants.NOT_FOUND).json({
          status: true,
          status_code: StatusCodesConstants.NOT_FOUND,
          message: MessageConstants.PRODUCT_NOT_PRESENT,
          data: [],
        });
      }else{
        return res.status(StatusCodesConstants.SUCCESS).json({
          status: true,
          status_code: StatusCodesConstants.SUCCESS,
          message: MessageConstants.PRODUCT_FETCHED_SUCCESSFULLY,
          data: productsData,
        });
      }
  
    } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(StatusCodesConstants.INTERNAL_SERVER_ERROR).json({ error: MessageConstants.INTERNAL_SERVER_ERROR });
    }
  }

}


