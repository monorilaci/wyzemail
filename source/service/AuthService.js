var database = require('./DatabaseService');

const SERVICE_NAME = "AuthService";

var authentication = exports.authentication = function(req) {
    let apiKey = req.headers['x-api-key'];
    if (apiKey == undefined || apiKey == null) {
        return false;
    } else {
        let checkApiKeyPromise = database.checkApiKey(apiKey);
        return new Promise(function(resolve, reject) {
            checkApiKeyPromise.then(function(result) {
                if (result) {
                    console.log(SERVICE_NAME + ": Api key is OK.");
                    return resolve(true);
                } else {
                    console.error(SERVICE_NAME + ": Api key isn't OK.");
                    return reject(false);
                }
            }, function(err) {
                return reject(false);
            });
        });
        
        
    }
}