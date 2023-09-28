const User = require('./user');
const Address = require('./address');
const Device = require('./device');
const DeliveryMan = require('./deliveryman')
const Otp = require('./otpmodels');
const RevokedTokens = require('./revokedTokens');


module.exports = {
    User,
    Address,
    Device,
    Otp,
    RevokedTokens,
    DeliveryMan
}