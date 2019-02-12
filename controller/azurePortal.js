let config = require("./common/config");
const {
    exec
} = require('child_process');

exports.filterExistingResourceGroup = function (resourceGroupNames, callback) {
    console.log(" filterExistingResourceGroup resourceGroupNames - ", resourceGroupNames);
    loginAzurePortalUsingAz(function (err, result) {
        if (err) {
            console.log("error during loginAzurePortalUsingAz ");
            callback(err, null);
        } else {
            // callback(null, 'done');
            var count = 0;
            var activeResourceGroup = [];
            var deadResourceGroups = [];
            async.whilst(
                function () {
                    return count < resourceGroupNames.length;
                },
                function (callback) {
                    console.log("Searching for resourceGroup ", count," Name: ", resourceGroupNames[count].resourceGroupName, " resources of total ", resourceGroupNames.length - 1, " resource groups" );
                    checkIfResourceGroupExist(resourceGroupNames[count],activeResourceGroup,deadResourceGroups,  function (err, result) {
                        if (err) {
                            console.log("error during checkIfResourceGroupExist", err);
                            return callback(err, null);
                        } else {
                            console.log("resourceGroup ", resourceGroupNames[count], " exists - ", result);
                            count ++;
                            return callback(null, 'done');
                        }
                    })
                },
                function (err, result) {
                    if (err) {
                        console.log("Error in while loop of checkIfResourceGroupExist");
                        return callback(err);
                    } else {
                        console.log("deadResourceGroups - ", deadResourceGroups);
                        console.log("activeResourceGroup - ", activeResourceGroup);
                        return callback(null, activeResourceGroup);
                    }
                }
            );
        }
    });
}

function checkIfResourceGroupExist(resourceGroupName,activeResourceGroup,deadResourceGroups, callback) {
    exec(`az group exists -n ${resourceGroupName.resourceGroupName}`, (err, stdout, stderr) => {
        if (err) {
            console.log("error during checkIfResourceGroupExist  ", err);
            callback(err, null);
        } else if (stdout) {
            console.log(" stdout -  ", stdout)
            console.log(" stdout type -  ", typeof(stdout))
            let result = JSON.parse(stdout);
            let eval = result == true;
            console.log(" eval-  ", eval)
            if(eval) {
                console.log("I am in activeResourceGroup true")
                exec(`az storage account list -g ${resourceGroupName.resourceGroupName}`, (err, stdout, stderr) => {
                    if (err) {
                        console.log("error during get storage account number  ", err);
                        //return callback(err, null);
                    } else if (stdout) {
                        let result = JSON.parse(stdout);
                        console.log(" number of storage accounts found -  ", result.length)
                        resourceGroupName["storageAccounts"] = result.length;

                        exec(`az vm list -g ${resourceGroupName.resourceGroupName}`, (err, stdout, stderr) => {
                            if (err) {
                                console.log("error during getVM in resource group  ", err);
                                return callback(err, null);
                            } else if (stdout) {
                                let vm = JSON.parse(stdout);
                                console.log(" result -  ", vm.length)
                                resourceGroupName["virtualMachiness"] = vm.length;
                                activeResourceGroup.push(resourceGroupName);
                                return callback(null, 'true')
                            } else if (stderr) {
                                console.log("error during azure checkIfResourceGroupExist stderr ", stderr);
                               return callback(err, null);
                            }
                        })
                    } else if (stderr) {
                        console.log("error during azure checkIfResourceGroupExist stderr ", stderr);
                       return callback(err, null);
                    }
                })
            }else {
                console.log("I am in activeResourceGroup false")
                deadResourceGroups.push(resourceGroupName);
                return callback(null, stdout)
            }
        } else if (stderr) {
            console.log("error during azure checkIfResourceGroupExist stderr ", stderr);
           return callback(err, null);
        }
    })
}

function loginAzurePortalUsingAz(callback) {
    let azureUsername = config.azurePortalUserName;
    let azurePassword = config.azurePortalPassword;
    exec(`az login -u ${azureUsername} -p ${azurePassword}`, (err, stdout, stderr) => {
        if (err) {
            console.log("error during azure login ", err);
            return callback(err, null);
        } else if (stdout) {
            stdout = JSON.parse(stdout);
            console.log("stdout ", stdout)
            console.log("stdout ", stdout.length);
            if (stdout.length > 0) {
                callback(null, 'done');
            } else {
                callback('login successful but no default subscription found', null);
            }
        } else if (stderr) {
            console.log("error during azure login stderr ", stderr);
            return callback(err, null);
        }
    });
}