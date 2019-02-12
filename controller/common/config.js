
let logger = require("./logger.js");


let azureUserName = process.env.azureUserName; 
if (azureUserName == undefined) {
    logger.log('error', 'environment variable  azureUserName not defined', azureUserName);
    process.exit(1);
}

let azurePassword = process.env.azurePassword;
if (azurePassword == undefined) {
    logger.log('error', 'environment variable  azurePassword not defined', azurePassword);
    process.exit(1);
}

let azurePortalUserName = process.env.azurePortalUserName;
if (azurePortalUserName == undefined) {
    logger.log('error', 'environment variable  azurePortalUserName not defined', azurePortalUserName);
    process.exit(1);
}

let azurePortalPassword = process.env.azurePortalPassword;
if (azurePortalPassword == undefined) {
    logger.log('error', 'environment variable  azurePortalPassword not defined', azurePortalPassword);
    process.exit(1);
}

let data1 = azureUserName + ':' + azurePassword;
base64Data = Buffer.from(data1).toString('base64');
let Authorization = "Basic " + base64Data;
let data = {
    azureUserName: azureUserName,
    azurePassword: azurePassword,
    azureDevOpsHeader: {
        'Authorization':Authorization,
        'content-type': 'application/json'
    },
    azurePortalUserName: azurePortalUserName,
    azurePortalPassword: azurePortalPassword,
    ProjectURL:"https://<accountName>.vsrm.visualstudio.com/<projectName>/_apis/Release/releases?definitionId=",
    ReleaseURL:"https://<accountName>.vsrm.visualstudio.com/<projectName>/_apis/Release/releases/"
}

module.exports = data;