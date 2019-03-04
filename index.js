/**
 * Main file for API
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiate the HTTP server
const httpServer = http.createServer( function(req, res) {
    unifiedServer(req, res);
});
// Start the HTTP server
httpServer.listen(config.httpPort, function(){
    console.log('The HTTP server is up and running on port:', config.httpPort  ,' - ', 'In ', config.envName, ' mode.');
});

// Instantiate the HTTPS server
const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem'),
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
    unifiedServer(req, res);
});
// Starts the HTTPS server
httpsServer.listen(config.httpsPort, function(){
    console.log('The HTTPS server is up and running on port:', config.httpsPort  ,' - ', 'In ', config.envName, ' mode.');
});

// The server should respond to all requests with a string
const unifiedServer = function(req, res) {
    // Get the URL and parse it
    const parserUrl = url.parse(req.url, true);

    // Get the path
    const path = parserUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as a object
    const queryStringObject = parserUrl.query;

    // Get the HTTP method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        console.log('router: ', {router} );
        console.log('router path: ', router[trimmedPath] );
        console.log('trimmedPath: ', trimmedPath );

        // Choose the appropriate handler, if not found, resolves the notFound handler
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        console.log('chosenHandler: ', chosenHandler);
        console.log('router.notFound: ', handlers.notFound);

        // Construct the data object to send to the handler
        let data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload) {
            // se the status code called back the handler, or default
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

            // User the payload called the handler, or default to an empty object
            payload = typeof(payload) === 'object' ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request
            console.log('- Returning the response: ', statusCode, payloadString);
        });
    });
};

// Define all the handlers
let handlers = {};

// Mains handler
handlers.main = (data, callback) => {
    callback(200, {'name' : 'This is the main handler.'});
    console.info('data: ', data);
};

// Sample handler
handlers.sample = function(data, callback){
    callback(406,{'sample message' : 'And this, is the sample handler'});
    console.info('data: ', data);
};

// Hello handler
handlers.hello = function(data, callback){
    callback(406,{'message' : 'Hello! This is a warm welcome from this Node application.  =)'});
    console.info('data: ', data);
};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};

// Define the request router
let router = {
    ''       : handlers.main,
    'sample' : handlers.sample,
    'hello'  : handlers.hello
};
