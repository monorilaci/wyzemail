'use strict';


/**
 * Get API key
 * 
 *
 * returns ApiKey
 **/
exports.getApiKeyGET = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "apiKey" : "apiKey"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Send e-mail
 * 
 *
 * email Email Data of e-mail
 * no response value expected for this operation
 **/
exports.sendPOST = function(email) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Upload attachment
 * 
 *
 * file Attachment Name of file
 * returns AttachmentIdentification
 **/
exports.uploadAttachmentPOST = function(file) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "id" : "id"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

