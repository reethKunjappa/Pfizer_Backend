'use strict';
var CheckList = require('../models/checklist.model');
var _ = require('lodash');
var Promise = require('bluebird')
var { DocumentSchema, ProductLabel } = require("../models/model");

var Audit = require('../models/audit.model')

module.exports.getAllCheckList =  (req, res, next) => {

    return Promise.props({
        checkList: CheckList.find({file_id:req.body.file_id, project_id:req.body.project_id}),
        project: ProductLabel.findById(req.body.project_id) 
    })
     .then( (response) => {
        var audit = {
            user: req.body.user,
            description: 'QC Report Genearted Successfully.',
            project: response.project,
            actionType: 'Generate QC Report',
        }
        Audit.create(audit);
            res.send({ result: response.checkList, status: { code: 0, message: "Get All Check list" } });
        }).catch((err) => {
            console.error(err);
            res.status(400).send({ success: false, err: err.message });
        });
}

