'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');
var auth = require('../service/AuthService');
var database = require('../service/DatabaseService');
var emailSender = require('../service/EmailSenderService');
var fileSaver = require('../service/FileSaverService');

module.exports.getApiKeyGET = function getApiKeyGET (req, res, next) {
  Default.getApiKeyGET().then(function (response) {
    let createApiKeyPromise = database.createApiKey();
    createApiKeyPromise.then(function(result)  {
      utils.writeJson(res, '{ "apiKey" : "' + result + '"}', 200);
    }, function(err) {
      throw err;
    });
  })
  .catch(function (response) {
      tils.writeJson(res, response, 500);
  });
};

module.exports.sendPOST = function sendPOST (req, res, next) {
  var email = req.swagger.params['email'].value;
  Default.sendPOST(email).then(function (response) {
    let authPromise = auth.authentication(req);
    authPromise.then(function(result) {
      if (result) {
        emailSender.sendEmail(email["to"], email["cc"], email["subject"], email["body"], email["attachmentIdentifications"]);
        utils.writeJson(res, response, 204);
      } else {
        utils.writeJson(res, response, 401);
      }
    }, function(err) {
      utils.writeJson(res, response, 401);
    });
  })
  .catch(function (response) {
    utils.writeJson(res, response, 500);
  });
};

module.exports.uploadAttachmentPOST = function uploadAttachmentPOST (req, res, next) {
  var file = req.swagger.params['file'].value;
  Default.uploadAttachmentPOST(file).then(function (response) {
    let authPromise = auth.authentication(req);
    authPromise.then(function(result) {
      if (!result) {
        utils.writeJson(res, response, 401);
      } 
    }, function(err) {
      throw err;
    });
    let fileSaverPromise = fileSaver.saveFile(req.headers['x-api-key'], file["fileName"], file["fileContent"]);
    fileSaverPromise.then(function(result) {
      utils.writeJson(res, '{ "id" : "' + result + '"}', 200);
    }, function(err) {
      throw err;
    });
  }).catch(function (response) {
    utils.writeJson(res, response, 500);
  });
};
