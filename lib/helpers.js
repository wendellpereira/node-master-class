/*
 * Helpers for various tasks
 *
 */

// Dependencies
const config = require('../config');
const crypto = require('crypto');

// Container for all the helpers
const helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
    // Avoids parse a empty string/object, which causes an error
    if (str.length < 1) return {};
    // Parsers the string to object
    try{
        return JSON.parse(str);
    } catch(e){
        return {};
    }
};

// Create a SHA256 hash
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    } else return false;
};

// Export the module
module.exports = helpers;