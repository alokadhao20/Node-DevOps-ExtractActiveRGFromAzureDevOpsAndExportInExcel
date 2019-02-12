async = require('async');
let logger = require("./controller/common/logger.js");
let azureDevOps = require("./controller/azureDevOps.js");
let azurePortal = require("./controller/azurePortal.js");
let excel = require("./controller/excel.js");


async.waterfall([
    function (callback) {
        logger.log('info', 'Step1 In progress - get all releases from release definition');
        // callback(null);
        let releaseID = 31;
        azureDevOps.getAllReleases(releaseID, function (err, totalReleases) {
            if (err) {
                logger.log('error', 'Step1 Error - getRankFromAzureBlob', err);
                callback(err);
            } else {

                logger.log('info', 'Step1 Done');
                callback(null, totalReleases);
            }
        });
    },function (totalReleases, callback) {
        logger.log('info', 'Step2 In progress - getResourceGroupCreationAttemptsInfo');
        azureDevOps.getResourceGroupCreationAttemptsInfo(totalReleases, function (err, logsURLarguments) {
            if (err) {
                logger.log('error', 'Step2 Error - getResourceGroupCreationAttemptsInfo', err);
                callback(err);
            } else {
                console.log("Total attempts found - ", logsURLarguments.length);
                logger.log('info', 'Step2 Done ');
                callback(null, logsURLarguments);
            }
        });
    },function (logsURLarguments, callback) {
        logger.log('info', 'Step3 In progress - getResourceGroupNames');
        azureDevOps.getResourceGroupNames(logsURLarguments, function (err, resourceGroupNames) {
            if (err) {
                console.log('error', 'Step3 Error - getResourceGroupNames', err);
                callback(err);
            } else {
                console.log("Total resource groups found - ", resourceGroupNames.length);
                logger.log('info', 'Step3 Done ');
                callback(null, resourceGroupNames);
            }
        });
    }, function (resourceGroupNames, callback) {
        logger.log('info', 'Step4 In progress - filterExistingResourceGroup');
        azurePortal.filterExistingResourceGroup(resourceGroupNames, function (err, activeResourceGroup) {
            if (err) {
                console.log('error', 'Step4 Error - filterExistingResourceGroup', err);
                callback(err);
            } else {
                console.log("Total active resource groups found - ", activeResourceGroup.length);
                logger.log('info', 'Step4 Done ');
                callback(null, activeResourceGroup);
            }
        });
    },function (activeResourceGroup, callback) {
        excel.exportToExcel(activeResourceGroup, function (err, outputFileName) {
            if (err) {
                console.log('error', 'Step5 Error - exportToExcel', err);
                callback(err);
            } else {
                logger.log('info', 'Step5 Done ');
                callback(null, outputFileName);
            }``
        });
    },
], function (err, outputFileName) {
    if (err) {
        logger.log('error', 'Error in pipeline ', err);
    } else {
        logger.log('info', 'Output stored in file', outputFileName);
    }
});