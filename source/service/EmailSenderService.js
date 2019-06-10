const nodemailer = require('nodemailer');
const SERVICE_NAME = "EmailSenderService";

var fs = require('fs');
var database = require('./DatabaseService');
var fileSaver = require('./FileSaverService');

var sendEmail = exports.sendEmail = function(toParam, ccParam, subjectParam, bodyParam, attachmentsParam) {
    nodemailer.createTestAccount((err, account) => {
        let transporter = nodemailer.createTransport({
            host: process.env.GOOGLE_SMTP_SERVER_HOST, // Gmail Host
            port: process.env.GOOGLE_SMTP_SERVER_PORT, // Port
            secure: true, // this is true as port is 465
            auth: {
                user: process.env.GOOGLE_SMTP_SERVER_AUTH_USER, //Gmail username
                pass: process.env.GOOGLE_SMTP_SERVER_AUTH_PASSWORD // Gmail password
            }
        });
     
        let emailToStringFromToParam = undefined;
        function convertEmailToArrayToString(emailAddress) {
            if (emailToStringFromToParam == undefined) {
                emailToStringFromToParam = emailAddress;
            } else {
                emailToStringFromToParam += ",";
                emailToStringFromToParam += emailAddress;
            }
        }
        toParam.forEach(convertEmailToArrayToString);

        let emailCcStringFromCcParam = undefined;
        function convertEmailCcArrayToString(emailAddress) {
            if (emailCcStringFromCcParam == undefined) {
                emailCcStringFromCcParam = emailAddress;
            } else {
                emailCcStringFromCcParam += ",";
                emailCcStringFromCcParam += emailAddress;
            }
        }
        if (ccParam != undefined || ccParam != null) {
            ccParam.forEach(convertEmailCcArrayToString);
        } 

        let emailAttachmentsFromAttachmentsParam = [];
        if (attachmentsParam != undefined || attachmentsParam != null) {
            let getAttachmentsByAttachmentsParamPromise = getAttachmentsByAttachmentsParam(attachmentsParam);
            getAttachmentsByAttachmentsParamPromise.then(function(result) {
                emailAttachmentsFromAttachmentsParam = result;
            }, function(err) {
                console.log(err.message);
            });

            
        }

        let mailOptions = {
            from: '"' + process.env.EMAIL_FROM_NAME  + '" <' +  process.env.EMAIL_FROM_ADDRESS + '>',
            to: emailToStringFromToParam,
            cc: emailCcStringFromCcParam,
            subject: subjectParam,
            html: bodyParam,
            attachments: emailAttachmentsFromAttachmentsParam
        };
     
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.error(error);
            }
            console.log('Message sent: %s', info.messageId);
        });
    });
}

function getAttachmentsByAttachmentsParam(attachmentsParam) {
    return new Promise(function(resolve, reject) {
        let emailAttachmentsFromAttachmentsParam = [];

        function getAttachmentById(attachmentId) {
            let getAttachmnetByIdPromise = database.getAttachmentById(attachmentId);
            getAttachmnetByIdPromise.then(function(result) {
                let filepath = "./" + fileSaver.getAttachmentsFolderName() + "/" + result.apiKey + "/" + result.filename;
                let filename = result.filename;
                let encoding = "base64";
                let contentBitmap = fs.readFileSync(filepath);
                let content = Buffer.from(contentBitmap).toString(encoding);
    
                let attachment = {
                    filename: filename,
                    content: fs.createReadStream(filepath)
                };
                emailAttachmentsFromAttachmentsParam.push(attachment);
            }, function(err) {
                console.error(err.message);
                throw err;
            });
        }
    
        if (attachmentsParam != undefined || attachmentsParam != null) {
            attachmentsParam.forEach(getAttachmentById);
        }

        return resolve(emailAttachmentsFromAttachmentsParam);
    });
}
