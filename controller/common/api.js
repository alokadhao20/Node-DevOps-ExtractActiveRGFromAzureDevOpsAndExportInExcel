let request = require('request');

exports.getData = function (URL, header, callback) {
    let options = {
        url: URL,
        method: 'GET',
        headers: header
    };
    request(options, function (error, response, body) {
        if (!error) {
            callback(null, body, response.statusCode);
        } else {
            callback(error, null);
        }
    });
}

exports.postData = function (URL, header, body, callback) {
    let options = {
        url: URL,
        headers: header,
        method: 'post',
        json: true,
        body: body
    };

    request(options, function (error, response, body) {
        if (!error) {
            callback(null, body, response.statusCode);
        } else {
            callback(error, null);
        }
    });
}

exports.putData = function (URL, header, body, callback) {
    let options = {
        url: URL,
        headers: header,
        method: 'put',
        json: true,
        body: body
    };

    request(options, function (error, response, body) {
        if (!error) {
            callback(null, body, response.statusCode);
        } else {
            callback(error, null);
        }
    });
}

exports.deleteData = function (URL, header, callback) {
    let options = {
        url: URL,
        headers: header,
        method: 'delete'
    };
    request(options, function (error, response, body) {
        if (!error) {
            callback(null, body);
        } else {
            callback(error, null);
        }
    });
}






