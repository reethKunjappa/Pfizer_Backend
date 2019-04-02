var mkdirp = require('mkdirp');
const { getModel } = require('../models/model');
var rimraf = require('rimraf');
exports.generateId = function (preceed, model) {
    return new Promise(function (resolve, reject) {
        let uniqueId = preceed;
        let year = new Date().getFullYear();
        model.countDocuments({}, function (err, count) {
            if (err) {
                reject(err);
            } else {
                uniqueId = uniqueId + "-" + year + "-" + count;
                resolve(uniqueId);
            }
        });
    });
};

exports.getCount = function (model, condition) {
    return new Promise(function (resolve, reject) {
        model.countDocuments(condition, function (err, count) {
            if (err) {
                reject(err);
            } else {
                resolve(count);
            }
        });
    });
};

exports.deleteFolder = function (dirPath) {
    return rimraf.sync(dirPath);
}
exports.getSequenceNumber = function (preceed, model, condition) {
    return new Promise(function (resolve, reject) {
        let year = new Date().getFullYear();
        model.find({ sequencetype: condition }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                if (data.length == 0) {
                    let seqmodel = new (model);
                    seqmodel.sequencetype = condition;
                    seqmodel.sequenceno = 1;
                    seqmodel.save(function (err, status) {
                        if (err) {
                            console.log("insert sequence number issue")
                        } else {
                            console.log("Sequence Inserted Successfully");
                        }
                    });
                    resolve(preceed + '-' + year + padDigits(1, 5));
                } else {
                    model.update({ sequencetype: condition }, { $set: { sequenceno: data[0].sequenceno + 1 } }, function (err, status) {
                        if (err) {
                            console.log("Update sequence number issue")
                        } else {
                            console.log("Sequence number updated");
                        }
                    });
                    resolve(preceed + '-' + year + padDigits(data[0].sequenceno + 1, 5));
                }
            }
        });
    });
};

exports.updateSequenceNumber = function (model, condition, newsequenceno) {
    model.update(condition, { $set: { sequenceno: newsequenceno } }, function (err, status) {
        if (err) {
            console.log("Update sequence number issue")
        } else {
            console.log("Sequence number updated");
        }
    })
};

exports.responseGenerator = function (valid, msg, output, count) {
    return { status: { code: valid, message: msg }, result: output, totalRecords: count };
};

exports.mkdir = function (path) {
    mkdirp(path, function (err) { });
}

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

