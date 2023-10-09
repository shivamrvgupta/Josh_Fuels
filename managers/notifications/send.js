const fs = require('fs');
const path = require('path');
var FCM = require('fcm-node');
const models = require('../models')

module.exports = {  
  sendPushNotification : async(userId, message) => {
    try {
      console.log('User Id:- '+userId);
      console.log('message:- '+message);

      fs.readFile(path.join(__dirname,'./FireBaseConfig.json'), "utf8", async(err, jsonString) => {
      if (err) {
          console.log("Error reading file from disk:", err);
          return err;
        }
        try {

          //firebase push notification send
          const data = JSON.parse(jsonString);
          var serverKey = data.SERVER_KEY;
          var fcm = new FCM(serverKey);

          console.log(serverKey)
          console.log(fcm)

          var push_tokens = await models.UserModel.Device.find({user_id: userId});
          console.log(push_tokens)
          var reg_ids = [];
          console.log(reg_ids)
          push_tokens.forEach(token => {
            reg_ids.push(token.fcm_token)
          })

          console.log(reg_ids)

          if(reg_ids.length > 0){
            var pushMessage = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
              registration_ids:reg_ids,
              content_available: true,
              mutable_content: true,
              notification: {
                  body: message,
                  icon : 'myicon',//Default Icon
                  sound : 'mySound',//Default sound
              },
            };
            console.log("Message --- ",pushMessage)
            fcm.send(pushMessage, function(err, response){
                console.log("Message --- I am hrere")
                if (err) {
                    console.log("Something has gone wrong!",err);
                } else {
                    console.log("Push notification sent.", response);
                }
            });

          }


        } catch (err) {
          console.log("Error parsing JSON string:", err);
        }
      });

    } catch (error) {
      console.log(error);
    }

  }
}


