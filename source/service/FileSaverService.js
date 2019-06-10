var fs = require('fs');
var fs_extra = require('fs-extra');
var database = require('../service/DatabaseService');
const SERVICE_NAME = "FileSaverService";
const ATTACHMENTS_FOLDER_NAME = "attachments";

var getAttachmentsFolderName = exports.getAttachmentsFolderName = function getAttachmentsFolderName() {
    return ATTACHMENTS_FOLDER_NAME;
}

var initialization = exports.initialization = function initialization()  {
    fs_extra.emptyDir("./" + ATTACHMENTS_FOLDER_NAME, err => {
        if (err) {
            console.error(err);
            throw err;
        } else {
            console.log(SERVICE_NAME + ": " + ATTACHMENTS_FOLDER_NAME + " folder was created");
        }
      })
}

var saveFile = exports.saveFile = function(apiKey, fileName, fileContent) {
    return new Promise(function(resolve, reject) {
        if (!fs.existsSync(ATTACHMENTS_FOLDER_NAME + "/" + apiKey)){
            fs.mkdirSync(ATTACHMENTS_FOLDER_NAME + "/" + apiKey);
            console.log(SERVICE_NAME + ": Folder created for attachments");
        }
        fs.writeFile("./" + ATTACHMENTS_FOLDER_NAME + "/" + apiKey + "/" + fileName, Buffer.from(fileContent, "base64"), function (err) {
            if (err) {
                console.error(SERVICE_NAME + ": Error: File saving failed")
                console.error(err);
                return reject();
            } else {
                console.log(SERVICE_NAME + ": The file was saved");
                let createAttachmentRowInDatabasePromise = database.createAttachment(apiKey, fileName);
                createAttachmentRowInDatabasePromise.then(function(result) {
                    return resolve(result);
                }, function(err) {
                    reject();
                });
            }
        });
    });
}

