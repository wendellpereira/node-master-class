/**
 * Library for storing and editing data
 *
 */


// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module (to be exported)
let lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (error, fileDescriptor) => {
        if (!error && fileDescriptor) {
            // Convert data do string
            const stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (error) => {
                if (!error) {
                    fs.close(fileDescriptor, (error) => {
                        if (!error) callback(false);
                        else callback(`Error closing the new file: ${error}`)
                    });
                } else callback(`Error writing to the new file: ${error}`);
            });
        } else callback(`Could not create the new file - Error: ${error}`);
    });
};

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (error, data) => {
        if(!error && data){
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(error, data);
        }
    });
};

// Update data to a existing file
lib.update = (dir, file, data, callback) => {
    // Open file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (error, fileDescriptor) => {
        if(!error) {
            // Convert data do string
            const stringData = JSON.stringify(data);

            // Write to the file and close it
            fs.writeFile(fileDescriptor, stringData, (error) => {
                if(!error) {
                    fs.close(fileDescriptor, (error) => {
                        if(!error) callback(false);
                        else callback(`Error closing the existing file ${file}! Error: ${error}`);
                    });
                } else callback(`Error writing to existing file ${file}! Error: ${error}`);
            });
        } else callback(`Could not open the file ${file} for updating. Error: ${error}`);
    })
};

// Delete a file
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (error) => {
        if(!error) callback(false);
        else callback(`Error deleting the file: ${error}`);
    });
};

/**
 * Export the module
 */
module.exports = lib;
