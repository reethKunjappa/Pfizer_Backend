var jwt = require('jsonwebtoken');
var config = require('../config/database');
const { ProductLabel, DocumentSchema } = require('../models/model');
const { responseGenerator } = require('../utility/commonUtils');
var { mkdir } = require('../utility/commonUtils');
var http = require('http');
var path = require('path');
var rp = require('request-promise');
var fs = require('fs');
var uuid = require('uuid-v4');
const appConfig = require('../config/appConfig');

exports.newProject = function (req, res) {
    var productLabel = new ProductLabel();
    var conflicts = {
        number: 0,
        types: {
            fontConflicts: 0,
            contentConflicts: 0,
            orderConflicts: 0,
        }
    };
    productLabel.projectName = req.body.projectName;
    productLabel.country = req.body.country;
    productLabel.createdBy = req.body.createdBy;
    productLabel.ownerName = req.body.ownerName;
    productLabel.createdOn = new Date();
    //As per UI requirement(Shashank) inserting static conflicts and favorite
    productLabel.conflicts = conflicts;
    productLabel.favorite = 0;

    productLabel.save(function (err) {
        if (err)
            res.json(responseGenerator(-1, "Project already exists.", err));
        else
            res.json(responseGenerator(0, "Successfully created Project", productLabel));
    });
}

exports.getProjects = function (req, res) {
    try {
        ProductLabel.find({}).sort({ modifiedDate: 'desc' }).exec(function (err, projects) {
            if (err)
                res.json(responseGenerator(-1, "Unable to retrieve Projects list", err));
            else
                res.json(responseGenerator(0, "Successfully retrieved Projects list", projects, ""));
        });
    } catch (e) {
        console.log(e);
    }
};


exports.viewProject = function (req, res) {
    try {
        ProductLabel.findOne({ _id: req.body._id }).populate('documents').exec(function (err, project) {
            if (err)
                res.json(responseGenerator(-1, "Unable to fetch the Project details", err));
            else
                res.json(responseGenerator(0, "Successfully retrieved Project details", project, 0));
        });
    } catch (e) {
        console.log(e);
    }
};

exports.compare = function (req, res) {
    var project = {};
    var conflictDoc = {
        type: 'CONFLICT'
    };
    var fileUploadPath = appConfig["FS_PATH"];
    var fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];

    return ProductLabel.findOne({ _id: req.body._id }).populate('documents')
        .then(function (_project) {
            project = _project;
            var coreDoc;
            // if (project && project.documents != null && project.documents.length > 0) {
            var payload = {
                "label_filepath": "",
                "ha_filepath": [],
                "checklist_filepath": [],
                "previousLabel_filepath": [],
                "fontFormat_filepath": [],
                "reference_filepath": [],
            };
            var basePath = path.resolve('./');

            project.documents.forEach(element => {
                var filePath = path.resolve(basePath, element.location, element.documentName);
                switch (element.fileType) {
                    case 'Label':
                        coreDoc = element;
                        conflictDoc = _.cloneDeep(coreDoc);
                        // var id = uuid();
                        // conflictDoc.documentId = id;
                        // conflictDoc.fileType = 'CONFLICT';
                        // conflictDoc.destination = fileVirtualPath + "/" + id + '/' + element.documentName;
                        // conflictDoc.location = fileUploadPath + '/' + id;
                        // payload.label_filepath = path.resolve('./', conflictDoc.location, conflictDoc.documentName);
                        break;
                    case 'Reference':
                        payload.reference_filepath.push(filePath);
                        break;
                    case 'Previous Label':
                        payload.reference_filepath.push(filePath);
                        break;
                    case 'HA Guidelines':
                        payload.ha_filepath.push(filePath);
                        break;
                    case 'Pfizer Checklist':
                        payload.checklist_filepath.push(filePath);
                        break;
                    case 'Font Format Spec':
                        payload.fontFormat_filepath.push(filePath);
                        break;
                }
            });

            payload = {
                "lpd_filepath": "C:\\Users\\Reeth\\Desktop\\lpd.docx",
                "ha_filepath": ["C:\\Users\\Reeth\\Desktop\\TemplateSPC-PIL-Labeling.pdf"]
            };
            // fs.copyFileSync(
            //     path.resolve('./', coreDoc.location, coreDoc.documentName),
            //     path.resolve('./', conflictDoc.location, conflictDoc.documentName),
            // )
            // fileUploadPath = appConfig["FS_PATH"];

            const options = {
                uri: 'http://34.204.2.145:3001/',
                method: 'POST',
                json: true,
                body: payload,
                headers: {
                    'Content-Type': 'application/json',
                }
            }

            return rp(options);
            // } else {
            //     throw new Error();
            // }
        }).then(function (result) {
            project.conflicts = result.conflicts;
            project.conflicts.type = result.conflicts.conflict_type;
            project.conflicts.comments = result.comments;
            // if (result.filePath) {

            // var documentId = uuid();
            // var conflictDoc = {
            //     documentName: path.basename(result.filePath),
            //     destination = fileVirtualPath + "/" + documentId + "/" + this.documentName,
            //     documentid: documentId,
            //     // documentSchema.version = "0.1";

            // }
            // var documentSchema = new DocumentSchema();
            // documentSchema.projectId = req.query.projectId;
            // documentSchema.fileType = req.query.fileType;
            // documentSchema.location = fileUploadPath;
            // documentSchema.uploadedBy = req.query.uploadedBy;
            // documentSchema.uploadedDate = new Date();
            // }

            return project.save();
        }).then(function (projectObj) {
            console.log("TCL: exports.compare -> projectObj", projectObj)

        }).catch(function (err) {
            console.log(err);
            return res.status(400).send({ success: false, err: err.message });
        })

};


exports.updateProject = function (req, res) {
    try {
        var productLabel = new ProductLabel();
        productLabel._id = req.body._id;
        productLabel.productName = req.body.productName;
        productLabel.ownerName = req.body.ownerName;
        productLabel.modifiedDate = req.body.modifiedDate;
        productLabel.country = req.body.country;
        productLabel.exceptedEndDate = req.body.exceptedEndDate;
        productLabel.documents = req.body.documents;
        productLabel.findByIdAndUpdate(req.body._id, { $set: productLabel }, {
            new: false
        }, function (err, request) {
            if (err) {
                res.json(responseGenerator(-1, "Unable to update the Project details", err));
            } else {
                res.json(responseGenerator(0, "Successfully updated the Project details", productLabel, 0));
            }
        });
    } catch (e) {
        console.log(e);
    }
};
