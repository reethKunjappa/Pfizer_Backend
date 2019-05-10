'use strict';
var CheckList = require('../models/checklist.model');
var _ = require('lodash');


module.exports.getAllCheckList =  (req, res, next) => {
    var query = req.body;
    return CheckList.find(query)
        .then( (checkList) => {
            res.send({ result: checkList, status: { code: 0, message: "Get All Check list" } });
        }).catch((err) => {
            console.error(err);
            res.status(400).send({ success: false, err: err.message });
        });
}

