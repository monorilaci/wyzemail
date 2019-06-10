const uuidv4 = require('uuid/v4');
const hat = require('hat');
const sqlite3 = require('sqlite3').verbose();

const SERVICE_NAME = "DatabaseService";

var async = require("async");
var moment = require('moment');

const NAME_OF_API_KEY_TABLE = "wyze_api_keys";
const NAME_OF_ATTACHMENTS_TABLE = "wyze_attachments";

let database = new sqlite3.Database('wyzemail.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error(SERVICE_NAME + ": Error: Cannot connect to SQlite database");
      console.error(err.message);
    }
    console.log(SERVICE_NAME + ": Connected to the in-memory SQlite database.");
});

var initialization = exports.initialization = function initialization() {
    console.log(SERVICE_NAME + ": Start SQlite Server initialization");
    let dropApiKeyTableSqlQuery = 'DROP TABLE IF EXISTS ' + NAME_OF_API_KEY_TABLE + ';';
    let dropAttachmentsTableSqlQuery = 'DROP TABLE IF EXISTS ' + NAME_OF_ATTACHMENTS_TABLE + ';';
    let createApiKeyTableSqlQuery = 'CREATE TABLE ' + NAME_OF_API_KEY_TABLE + ' (id VARCHAR(36) PRIMARY KEY, key VARCHAR(32), created DATETIME2, expiration DATETIME2);';
    let createAttachmentsTableSqlQuery = 'CREATE TABLE ' + NAME_OF_ATTACHMENTS_TABLE + ' (id VARCHAR(36) PRIMARY KEY, filename VARCHAR(32), apiKey VARCHAR(32), created DATETIME2);';
    database.serialize(() => {
        database.run(dropApiKeyTableSqlQuery, (err) => {
            if (err) {
                console.error(SERVICE_NAME + ": Error: Cannot drop table: " + NAME_OF_API_KEY_TABLE);
                console.error(err.message);
            }
            console.log(SERVICE_NAME + ": Dropped " + NAME_OF_API_KEY_TABLE + " table if existed.");
        })
        database.run(dropAttachmentsTableSqlQuery, (err) => {
            if (err) {
                console.error(SERVICE_NAME + ": Error: Cannot drop table: " + NAME_OF_ATTACHMENTS_TABLE);
                console.error(err.message);
            }
            console.log(SERVICE_NAME + ": Dropped " + NAME_OF_ATTACHMENTS_TABLE + " table if existed.");
        })
        database.run(createApiKeyTableSqlQuery, (err) => {
            if (err) {
                console.error(SERVICE_NAME + ": Error: Cannot create table: " + NAME_OF_API_KEY_TABLE);
                console.error(err.message);
            } 
            console.log(SERVICE_NAME + ": Created " + NAME_OF_API_KEY_TABLE + " table.");
        })
        database.run(createAttachmentsTableSqlQuery, (err) => {
            if (err) {
                console.error(SERVICE_NAME + ": Error: Cannot create table: " + NAME_OF_ATTACHMENTS_TABLE);
                console.error(err.message);
            } 
            console.log(SERVICE_NAME + ": Created " + NAME_OF_ATTACHMENTS_TABLE + " table.");
        })
    });
}

var checkApiKey = exports.checkApiKey = function checkApiKey(apiKey) {
    let sql = 'SELECT id, key, created, expiration FROM "' + NAME_OF_API_KEY_TABLE + '" WHERE key = ?';
    return new Promise(function(resolve, reject) {
        database.get(sql, [apiKey], (err, row) => {
            if (err){
                console.log(SERVICE_NAME + ": Error: Cannot read row from database")
                throw err;
            }
            if (row) {
                console.log(SERVICE_NAME + ": Matched api key")
                return resolve(true);
            } else {
                console.error(SERVICE_NAME + ": No api key found with this key: " + apiKey);
                return reject(false);
            }
          });
    });
}

function closeConnection(database) {
    database.close((err) => {
        if (err) {
            console.error(SERVICE_NAME + ": Error: Cannot close SQlite database connection");
            console.error(err.message);
        }
        console.log(SERVICE_NAME + ": Database connection closed");
      });
      return database;
}

function createApiKeyTable(createApiKeyTableSqlQuery, database) {
    database.run(createApiKeyTableSqlQuery, (err) => {
        if (err) {
            console.error(SERVICE_NAME + ": Error: Cannot create table: " + NAME_OF_API_KEY_TABLE);
            console.error(err.message);
        } 
        console.log(SERVICE_NAME + ": Created " + NAME_OF_API_KEY_TABLE + " table.");
    });
}

function dropApiKeyTable(dropApiKeyTableSqlQuery, database) {
    database.run(dropApiKeyTableSqlQuery, (err) => {
        if (err) {
            console.error(SERVICE_NAME + ": Error: Cannot drop table: " + NAME_OF_API_KEY_TABLE);
            console.error(err.message);
        }
        console.log(SERVICE_NAME + ": Dropped " + NAME_OF_API_KEY_TABLE + " table if existed.");
    });
}

var createApiKey = exports.createApiKey = function createApiKey() {
    let id = generateUuid();
    let key = generateApiKey();
    let currentTime = getCurrentTime();
    let expirationTime = getExpirationTime();
    let insertSqlQuery = 'INSERT INTO ' + NAME_OF_API_KEY_TABLE + ' (id, key, created, expiration) VALUES ("' + id + '", "' + key + '", "' + currentTime + '", "' + expirationTime + '");';
    return new Promise(function(resolve, reject)  {
        database.run(insertSqlQuery, (err, rows) => {
            if (err) {
                console.error(SERVICE_NAME + ": Error: Cannot insert row to the " + NAME_OF_API_KEY_TABLE + " table");
                console.error(err.message);
                return reject();
            }
            console.log(SERVICE_NAME + ": A row has been inserted to the " + NAME_OF_API_KEY_TABLE + " table.");
            return resolve(key);
        });
    });
}

var createAttachment = exports.createAttachment = function createAttachment(apiKey, fileName) {
    return new Promise(function(resolve, reject) {
        let id = generateUuid();
        let currentTime = getCurrentTime();
        let insertSqlQuery = 'INSERT INTO ' + NAME_OF_ATTACHMENTS_TABLE + ' (id, filename, apiKey, created) VALUES ("' + id + '", "' + fileName + '", "' + apiKey + '", "' + currentTime  + '");';
        database.run(insertSqlQuery, (err, rows) => {
            if (err) {
                console.error(SERVICE_NAME + ": Error: Cannot insert row to the " + NAME_OF_ATTACHMENTS_TABLE + " table");
                console.error(err.message);
                return reject();
            } else {
                console.log(SERVICE_NAME + ": A row has been inserted to the " + NAME_OF_ATTACHMENTS_TABLE + " table.");
                return resolve(id);
            }
        });
    });
}

var getAttachmentById = exports.getAttachmentById = function getAttachmentById(attachmentId) {
    let sql = 'SELECT id, filename, apiKey, created FROM "' + NAME_OF_ATTACHMENTS_TABLE + '" WHERE id = ?';
    return new Promise(function(resolve, reject) {
        database.get(sql, [attachmentId], (err, row) => {
            if (err){
                console.log(SERVICE_NAME + ": Error: Cannot read row from database")
                throw err;
            }
            if (row) {
                console.log(SERVICE_NAME + ": Matched attachment");
                return resolve(row);
            } else {
                console.error(SERVICE_NAME + ": No attachment found with this key: " + attachmentId);
                return reject(false);
            }
          });
    });
}

function generateUuid() {
    let uuid = uuidv4();
    return uuid;
}

function generateApiKey() {
    let apiKey = hat();
    return apiKey;
}

function getCurrentTime() {
    let currentTime =  moment().format('YYYY-MM-DD HH:mm:ss');
    return currentTime;
}

function getExpirationTime() {
    let expirationTime = moment().add(process.env.API_KEY_EXPIRATION_HOURS, 'h').format('YYYY-MM-DD HH:mm:ss');
    return expirationTime;
}
