//jshint esversion:6
require("dotenv").config();
const express = require("express");
const app = express();
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path"); 
const bcrypt = require("bcrypt")
const morgan = require("morgan")
const mongoose = require("mongoose");
const db = require('./managers/models/db')
const routesApi = require('./api');

app.set('view engine', 'ejs'); // Set EJS as the default template engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(bodyParser.json({extended: true}));
app.use(express.static("public"));

app.use(morgan(':method :url :status :user-agent - [:date[clf]] :response-time ms'));
app.use('/api/auth/images', express.static(path.join(__dirname, 'uploads')));

  
app.use('/api', routesApi);
console.log("here")

ports = [process.env.PORT, process.env.PORT1, process.env.PORT2]
// Loop through the ports and start the server on each port
ports.forEach((port) => {
    app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    });
});