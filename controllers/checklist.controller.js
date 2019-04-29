'use strict';
var CheckList = require('../models/checklist.model');
var _ = require('lodash');
const { responseGenerator } = require('../utility/commonUtils');

module.exports.getAllCheckList = function (req, res, next) {
    var query = req.body;
    return CheckList.find(query)
        .then(function (checkList) {
            res.send({ result: checkList, status: { code: 0, message: "Get All Check list" } });
        }).catch(function (err) {
            console.error(err);
            res.status(400).send({ success: false, err: err.message });
        });
}
