const { initializeApp, applicationDefault } = require("firebase-admin/app");
const firebaseAdmin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const express  = require("express");
const { json } = require("express");

process.env.GOOGLE_APPLICATION_CREDENTIALS;


const app = express();
app.use(express.json());


app.use(function(req,res, next){
  res.setHeader("Content-Type", "application/json");
  next();
});

initializeApp({
  credential: applicationDefault(),
  projectId: "joshfuels"
})


module.exports = {
};
