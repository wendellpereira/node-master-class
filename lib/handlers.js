/*
 * Request Handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define all the handlers
const handlers = {};

// Ping
handlers.ping = (data,callback) => {
    callback(200);
};

// Not-Found
handlers.notFound = (data,callback) => {
    callback(404);
};

// Mains handler
handlers.main = (data, callback) => {
    callback(200, {'name' : 'This is the main handler.'});
    console.info('data: ', data);
};

// Sample handler
handlers.sample = (data, callback) => {
    callback(406,{'sample message' : 'And this, is the sample handler'});
    console.info('data: ', data);
};

// Hello handler
handlers.hello = (data, callback) => {
    callback(406,{'message' : 'Hello! This is a warm welcome from this Node application.  =)'});
    console.info('data: ', data);
};

// Users
handlers.users = (data,callback) => {
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    } else {
        callback(405);
    }
};

// Container for all the users methods
handlers._users  = {};

// Create a new User
// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data,callback) => {
    // Check that all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement === true;

    if(firstName && lastName && phone && password && tosAgreement){
        // Make sure the user doesnt already exist
        _data.read('users',phone,(err) => {
            if(err){
                // Hash the password
                const hashedPassword = helpers.hash(password);

                // Create the user object
                if(hashedPassword){
                    const userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, (err) => {
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500,{'Error' : `Could not create the new user: ${err}`});
                        }
                    });
                } else callback(500,{'Error' : 'Could not hash the user\'s password.'});

            } else callback(400,{'Error' : `A user with that phone number already exists.`});
        });

    } else {
        callback(400,{
            'error' : 'Missing required fields',
            'message' : `firstName: ${!firstName? '>>>':''}${firstName},  lastName: ${!lastName? '>>>':''}${lastName},  phone: ${!phone ? '>>>':''}${phone}, password: ${!password ? '>>>':''}${password ? password.replace(/\d/g, '*'):false}, tosAgreement: ${!tosAgreement ? '>>>':''}${tosAgreement}`
        });
    }

};

// Retrieves the User information's, except the password
// Required data: phone
// Optional data: none
// @TODO Only const an authenticated user access their object. Dont const them access anyone elses.
handlers._users.get = (data,callback) => {
    // Check that phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        // Lookup the user
        _data.read('users',phone,(err,data) => {
            if(!err && data){
                // Remove the hashed password from the user user object before returning it to the requester
                delete data.hashedPassword;
                callback(200,data);
            }
            else if (err || !data) callback(404, {'Error' : 'User with the phone: ' + phone + ' not found. ' + err.stack});
        });
    } else {
        callback(400,{'Error' : 'Missing phone field or it\'s in incorrect format. Must have 10 digits.'})
    }
};

// Update the User information's
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update anyone else's.
handlers._users.put = (data,callback) => {
    // Check for required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

    // Check for optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName  = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password  = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone is invalid
    if(phone){
        // Error if nothing is sent to update
        if(firstName || lastName || password) {
            // Lookup the user
            _data.read('users',phone,(err,userData) => {
                if(!err && userData){
                    // Update the fields if necessary
                    if(firstName) userData.firstName = firstName;
                    if(lastName)  userData.lastName = lastName;
                    if(password)  userData.hashedPassword = helpers.hash(password);
                    // Store the new updates
                    _data.update('users',phone,userData,(err) => {
                        if(!err)callback(200);
                        else {
                            console.log(err);
                            callback(500,{'Error' : 'Could not update the user.'});
                        }
                    });
                } else callback(400,{'Error' : 'Specified user does not exist.'});
            });
        } else {
            callback(400,{
                'error' : 'Missing required fields',
                'message' : `firstName: ${!firstName? '>>>':''}${firstName},  lastName: ${!lastName? '>>>':''}${lastName},  phone: ${!phone ? '>>>':''}${phone}, password: ${!password ? '>>>':''}${password ? password.replace(/\d/g, '*'):false}`
            });
        }
    } else callback(400,{'Error' : 'Missing phone field or it\'s in incorrect format. Must have 10 digits.'});
};

// Required data: phone
// @TODO Only const an authenticated user delete their object. Dont const them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data,callback) => {
    // Check that phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        // Lookup the user
        _data.read('users',phone,(err,data) => {
            if(!err && data){
                _data.delete('users',phone,(err) => {
                    if(!err) callback(200);
                    else callback(500, {'Error' : 'Could not delete the specified user'});
                });
            } else callback(400, {'Error' : `Could not find the specified user. ${err}`});
        });
    } else callback(400, {'Error' : 'Missing phone field or it\'s in incorrect format. Must have 10 digits.'})
};

// Export the handlers
module.exports = handlers;