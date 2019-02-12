exports.exportToExcel = function (activeResourceGroup, callback) {

    convertJsonDataToCSV(activeResourceGroup, function (err, csvData) {
        if (err) {
            console.log('Some error occured -Data was unable to convert into CSV');
        } else {
            // console.log('data converted to CSV format', csvData);
            let outputFileName =  getFormattedTime();
            console.log("outputFileName  ", outputFileName);
            writeCSVdataToFile('Output/'+outputFileName+'.csv', csvData, function (err, result) {
                if (err) {
                    console.log('Some error occured - file either not saved or corrupted file saved.', err);
                } else {
                    console.log('It\'s saved!', result);
                    callback(null, outputFileName);
                }
            });
        }
    });
}

function convertJsonDataToCSV(jsonObj, callback) {
    const Json2csvParser = require('json2csv').Parser;
    const json2csvParser = new Json2csvParser({
        jsonObj
    });
    const csvdata = json2csvParser.parse(jsonObj);
    // console.log("data json2csvParser ", csvdata);
    callback(null, csvdata);
}

function writeCSVdataToFile(filePath, csvData, callback) {
    var fs = require('fs');
    fs.writeFile(filePath, csvData, 'utf8', function (err) {
        if (err) {
            callback(err, null)
        } else {
            callback(null, 'saved')
        }
    });
}

function getFormattedTime() {
    var today = new Date();
    var y = today.getFullYear();
    // JavaScript months are 0-based.
    var m = today.getMonth() + 1;
    var d = today.getDate();
    var h = today.getHours();
    var mi = today.getMinutes();
    var s = today.getSeconds();
    return y + "-" + m + "-" + d + "-" + h + "-" + mi + "-" + s;
}