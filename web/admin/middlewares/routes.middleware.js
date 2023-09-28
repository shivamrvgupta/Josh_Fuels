const os = require('os');
const hostname = os.hostname();
const PORT = process.env.port;

// Routes APP
const finalRoute = {
  baseUrl: "http://127.0.0.1/",
};

let route;

if (hostname === process.env.localhost1 || hostname === process.env.localhost ) {
  // If the hostname is localhost or 127.0.0.1, use a different route
  route = `${hostname}:${PORT}/`;
  console.log(route);
} else if (hostname === process.env.ipAddress) {
  // If the hostname matches the specific IP address, use another route
  route = `http://${ipAddress}:${PORT}/`;
  console.log(route);
} else {
  // If it's not localhost or the specific IP, use the default route
  route = finalRoute.baseUrl;
  console.log(route);
}

module.exports = {
    finalRoute,
    route,
}


