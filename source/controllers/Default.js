'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');
var auth = require('../service/AuthService');
var database = require('../service/DatabaseService');
var emailSender = require('../service/EmailSenderService');
var fileSaver = require('../service/FileSaverService');

var recentRequestTimes = [];
var maximumRequests = 10;
var maximumRequestTime = 36000;

module.exports.getApiKeyGET = function getApiKeyGET (req, res, next) {
  Default.getApiKeyGET().then(function (response) {
    var old, now = Date.now();
    recentRequestTimes.push(now);
    if (recentRequestTimes.length >= maximumRequests) {
      old = recentRequestTimes.shift();
      if (now - old <= maximumRequestTime) {
        res.set('X-RateLimit-Limit', maximumRequests);
        utils.writeJson(res, response, 429);
      }
    }
    let createApiKeyPromise = database.createApiKey();
    createApiKeyPromise.then(function(result)  {
      utils.writeJson(res, '{ "apiKey" : "' + result + '"}', 200);
    }, function(err) {
      throw err;
    });
  })
  .catch(function (response) {
      utils.writeJson(res, response, 500);
  });
};

module.exports.sendPOST = function sendPOST (req, res, next) {
  var email = req.swagger.params['email'].value;
  Default.sendPOST(email).then(function (response) {
    var old, now = Date.now();
    recentRequestTimes.push(now);
    if (recentRequestTimes.length >= maximumRequests) {
      old = recentRequestTimes.shift();
      if (now - old <= maximumRequestTime) {
        res.set('X-RateLimit-Limit', maximumRequests);
        utils.writeJson(res, response, 429);
      }
    }
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
    var old, now = Date.now();
    recentRequestTimes.push(now);
    if (recentRequestTimes.length >= maximumRequests) {
      old = recentRequestTimes.shift();
      if (now - old <= maximumRequestTime) {
        res.set('X-RateLimit-Limit', maximumRequests);
        utils.writeJson(res, response, 429);
      }
    }
    let authPromise = auth.authentication(req);
    authPromise.then(function(result) {
      if (!result) {
        utils.writeJson(res, response, 401);
      } 
    }, function(err) {
      throw err;
    });
    let fileNameSplit = file["fileName"].split(".");
    let fileExtension = String(fileNameSplit[fileNameSplit.length - 1]);
    var attachmentExtensions = process.env.ATTACHMENTS_EXTENSIONS.split(",");
    var checkExtension = attachmentExtensions.find(extension => extension == fileExtension);
    if (checkExtension == undefined) {
      console.error("Invalid file extension");
      utils.writeJson(res, response, 403);
    } else {
      let fileSaverPromise = fileSaver.saveFile(req.headers['x-api-key'], file["fileName"], file["fileContent"]);
      fileSaverPromise.then(function(result) {
        utils.writeJson(res, '{ "id" : "' + result + '"}', 200);
      }, function(err) {
        throw err;
      });
    }
  }).catch(function (response) {
    utils.writeJson(res, response, 500);
  });
};
