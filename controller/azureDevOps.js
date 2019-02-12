let api = require("./common/api");
let config = require("./common/config");
let logger = require("./common/logger.js");


exports.getAllReleases = function (releaseId, callback) {
    let releaseURL = config.ProjectURL + releaseId + "&definitionEnvironmentId=0&searchText=&createdBy=&statusFilter=0&environmentStatusFilter=0&queryOrder=0&%24top=25&%24expand=94&artifactTypeId=&sourceId=&artifactVersionId=&sourceBranchFilter=&isDeleted=false&tagFilter=&propertyFilters=&releaseIdFilter="
    let lastContinueReleasID = null;
    let totalReleases = []
    async.whilst(
        function () {
            return releaseURL != null;
        },
        function (innercallback) {
            api.getData(releaseURL, config.azureDevOpsHeader, function (err, results, statusCode) {
                if (err) {
                    logger.log('error', 'Error in releaseURL ');
                    callback(err);
                } else if (statusCode != 200) {
                    logger.log('error', 'releaseURL statusCode is not 200');
                    callback(statusCode);
                    return;
                } else {
                    try {
                        results = JSON.parse(results);
                        if (results.count > 0) {
                            let continueReleasID = results.value[results.count - 1].id;
                            if (results.count == 1 && continueReleasID == lastContinueReleasID) {
                                releaseURL = null;
                            } else {
                                if (lastContinueReleasID != null) {
                                    results.value.shift();
                                }
                                totalReleases = totalReleases.concat(results.value);
                                lastContinueReleasID = continueReleasID;
                                let continueURL2 = config.ProjectURL + releaseId + "&definitionEnvironmentId=0&searchText=&createdBy=&statusFilter=0&environmentStatusFilter=0&queryOrder=0&%24top=25&continuationToken=" + continueReleasID + "&%24expand=94&artifactTypeId=&sourceId=&artifactVersionId=&sourceBranchFilter=&isDeleted=false&tagFilter=&propertyFilters=&releaseIdFilter="
                                releaseURL = continueURL2;
                            }
                        } else {
                            releaseURL = null;
                        }
                        innercallback(null, releaseURL);
                    } catch (err) {
                        logger.log('error', 'Error during parse releaseURL results  - ');
                        callback(err);
                    }
                }
            });
        },
        function (err, repos) {
            if (err) {
                logger.log('error', 'Error in getAllReleases while loop ');
                callback(err);
            } else {
                logger.log('trace', 'result function of getAllReleases');
                // console.log(""totalReleases);
                for (let i = 0; i < totalReleases.length; i++) {
                    console.log(totalReleases[i].name);
                }
                console.log("totalReleases found - ", totalReleases.length);
                callback(null, totalReleases);
            }
        });

}
// *********************************************************************************************
exports.getResourceGroupCreationAttemptsInfo = function (totalReleases, callback) {
    var count = 0;
    var logsURLarguments = [];
    async.whilst(
        function () {
            // console.log("In condition check");
            return count < totalReleases.length;
        },
        function (callback) {
            console.log("Processing release ", totalReleases[count].name);
            singleReleaseLevel(totalReleases[count], logsURLarguments, function (err, result) {
                if (err) {
                    console.log("error during  release ", totalReleases[count].name);
                    return callback(err);
                } else {
                    console.log("Finished processing release ", totalReleases[count].name);
                    count++;
                    return callback();
                }
            })
        },
        function (err, result) {
            if (err) {
                console.log("Error in while loop of getResourceGroupCreationAttemptsInfo");
                return callback(err)
            } else {
                console.log("logsURLarguments - ", logsURLarguments);
                return callback(null, logsURLarguments);
            }

        }
    );

}

function singleReleaseLevel(release, logsURLarguments, callback) {
    let GetReleaseAttemptsURL = config.ReleaseURL + release.id + "?approvalFilters=7&propertyFilters=DownloadBuildArtifactsUsingTask%2C+ReleaseCreationSource"
    api.getData(GetReleaseAttemptsURL, config.azureDevOpsHeader, function (err, results, statusCode) {
        if (err) {
            logger.log('error', 'Error in GetReleaseAttemptsURL ');
            return callback(err);
        } else if (statusCode != 200) {
            logger.log('error', 'GetReleaseAttemptsURL statusCode is not 200');
            callback(statusCode);
            return;
        } else {
            try {
                results = JSON.parse(results);
                async.map(results.environments, singleEnvironmentLevel.bind(this, results.name, results.id, logsURLarguments), function (error, result) {
                    if (error) {
                        console.log("**********************ERROR***************************", error);
                        return callback(error, null);
                    } else {
                        // console.log("singleEnvironmentLevel conbined result - ", result);
                        return callback(null, result);
                    }
                });
            } catch (err) {
                logger.log('error', 'Error during parse releaseURL results  - ', err);
                return callback(err);
            }
        }
    })
}

function singleEnvironmentLevel(releaseName, releaseId, logsURLarguments, environment, callback) {
    var envName = environment.name;
    var envId = environment.id;
    var pos = envName.search("VM Create");
    if (pos != -1 && environment.status != "notStarted") {
        console.log("releaseName - ", releaseName, " releaseId - ", releaseId, "environment.name  - ", environment.name, " environment.id ", environment.id);
        console.log("Total attempts - ", environment.deploySteps.length);
        async.map(environment.deploySteps, deploySteps.bind(this, releaseId, logsURLarguments, releaseName, envName, envId), function (error, result) {
            if (error) {
                console.log("******************ERROR*********map***environment.deploySteps**********");
                return callback(error, null);
            } else {
                return callback(null, 'done')
            }

        });
    } else {
        return callback(null, envName);
    }
}

function deploySteps(releaseId, logsURLarguments, releaseName, envName, envId, deployStep, callback) {
    console.log("attempt - ", deployStep.attempt, " status - ", deployStep.status);
    if (deployStep.status != 'notDeployed') {
        let phaseId = deployStep.releaseDeployPhases[0].phaseId;
        let MoveVMStepName = null;
        console.log("phaseId - ", phaseId);
        console.log("total tasks - ", deployStep.releaseDeployPhases[0].deploymentJobs[0].tasks.length);
        let tasks = deployStep.releaseDeployPhases[0].deploymentJobs[0].tasks;
        var MoveVMTaskId = null;
        for (let i = 0; i < tasks.length; i++) {

            let tasksName = tasks[i].name;
            let nameSearchIndex = tasksName.search("Move VM")
            if (nameSearchIndex != -1) {
                MoveVMStepName = tasks[i].name;
                MoveVMTaskId = tasks[i].id;
            }
        }
        if (MoveVMTaskId == null) {
            console.log("MoveVMTaskId not found as it was not executed - ", MoveVMTaskId);
        } else {
            console.log("Task name found - ", MoveVMStepName, " MoveVMTaskId - ", MoveVMTaskId);
            let logsURLargumentObj = {
                'releaseName': releaseName,
                'releaseId': releaseId,
                'envName': envName,
                'envId': envId,
                'phaseId': phaseId,
                'taskId': MoveVMTaskId,
                'taskName': MoveVMStepName,
                'attemptNo': deployStep.attempt,
                'status': deployStep.status
            }
            logsURLarguments.push(logsURLargumentObj);
        }
        console.log("--------------------------------------------");
        return callback(null, 'done');
    } else {
        console.log("---------------This attempt is not deployed-----------------------------");
        return callback(null, 'done');
    }
}


// *********************************************************************************************
exports.getResourceGroupNames = function (logsURLarguments, callback) {
    var count = 0;
    var resourceGroupNames = [];
    async.whilst(
        function () {
            // console.log("In condition check");
            return count < logsURLarguments.length;
        },
        function (callback) {
            console.log("Searching for ", count, " log file of total ", logsURLarguments.length - 1, " log files");
            singlelogFileArguments(logsURLarguments[count], resourceGroupNames, function (err, result) {
                if (err) {
                    console.log("error during  release ", logsURLarguments[count]);
                    return callback(err);
                } else {
                    console.log("Finished processing release ", logsURLarguments[count]);
                    count++;
                    return callback();
                }
            })
        },
        function (err, result) {
            if (err) {
                console.log("Error in while loop of getResourceGroupCreationAttemptsInfo");
                return callback(err)
            } else {
                console.log("resourceGroupNames - ", resourceGroupNames);
                return callback(null, resourceGroupNames);
            }

        }
    );
}

function singlelogFileArguments(singleLogFileURLarguments, resourceGroupNames, callback) {
    console.log("Getting logs file currently from - ", singleLogFileURLarguments);
    let logURL = config.ReleaseURL + singleLogFileURLarguments.releaseId + "/environments/" + singleLogFileURLarguments.envId + "/deployPhases/" + singleLogFileURLarguments.phaseId + "/tasks/" + singleLogFileURLarguments.taskId + "/logs"
    console.log("URL - ", logURL);
    api.getData(logURL, config.azureDevOpsHeader, function (err, results, statusCode) {
        if (err) {
            logger.log('error', 'Error in logURL ');
            return callback(err);
        } else if (statusCode != 200) {
            console.log('error', 'logURL statusCode is not 200 - ', statusCode);
            callback(statusCode);
            return;
        } else {
            try {
                let completeData = results;
                var pos = completeData.search("Creating Resource Group:");
                if (pos != -1) {
                    let start = pos + 25;
                    var end = completeData.indexOf("\n", start);
                    var ResourceGroup = completeData.slice(start, end - 1);
                    singleLogFileURLarguments["resourceGroupName"] = ResourceGroup;
                    console.log("----ResourceGroup-----", ResourceGroup);
                    resourceGroupNames.push(singleLogFileURLarguments);
                    return callback(null, 'done');
                } else {
                    console.log("resource group not created for ", logURL);
                    return callback(null, 'done');
                }
            } catch (err) {
                logger.log('error', 'Error during parse releaseURL results  - ', err);
                return callback(err);
            }
        }
    })
}