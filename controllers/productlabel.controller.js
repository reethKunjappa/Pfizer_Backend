var jwt = require('jsonwebtoken');
var config = require('../config/database');
const { ProductLabel, DocumentSchema } = require('../models/model');
var FavouriteSchema = require('../models/favourite.model');
const { responseGenerator } = require('../utility/commonUtils');
var { mkdir } = require('../utility/commonUtils');
var http = require('http');
<<<<<<< HEAD
var _ = require('lodash');
=======
var path = require('path');
var rp = require('request-promise');
var fs = require('fs');
var uuid = require('uuid-v4');
const appConfig = require('../config/appConfig');
var _ = require('lodash');
require('mongoose').set('debug', true);
>>>>>>> 333d4836d94c84394d2ccb88d63508d28c1a5c34

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
            else{
                    getUserFav(req, res, projects);
                //res.json(responseGenerator(0, "Successfully retrieved Projects list", projects, ""));
            }
                
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
            if (project && project.documents != null && project.documents.length > 0) {
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
                            payload.lpd_filepath = path.resolve('./', conflictDoc.location, conflictDoc.documentName);
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
            } else {
                throw new Error();
            }
        }).then(function (result) {
            project.conflicts = result.conflicts;
            project.conflicts.types = result.conflicts.conflict_type;
            project.conflicts.comments = result.comments;
            return project.save();
        }).then(function (projectObj) {
            return res.send(responseGenerator(1, "Compared document", projectObj));
        }).catch(function (err) {
            console.log(err);
            return res.status(400).send({ success: false, err: err.message });
        })

};


exports.updateProject = function (req, res) {

    var productLabel = new ProductLabel(req.body);
    return ProductLabel.findByIdAndUpdate(req.body._id,
        { $set: productLabel },
        { new: false }
    ).then(function () {
        res.json(responseGenerator(0, "Successfully updated the Project details", productLabel, 0));
    }).catch(function (err) {
        res.json(responseGenerator(-1, "Unable to update the Project details", err));
    });

};

function getUserFav (req, res, projects) {
    try {
        FavouriteSchema.find({'user.userId': req.body.user.userId}).exec(function (err, userFavprojects) {
            if (err)
                res.json(responseGenerator(-1, "Unable to retrieve Projects list", err));
            else {
                var userFav = _.groupBy(userFavprojects,'project');
                projects.forEach(function(key){
                    if(userFav[key._id]){
                        key.favorite= true
                    }else{
                        key.favorite = false;
                    }
                    return key;
                })
                res.json(responseGenerator(0, "Successfully retrieved Projects list", projects, ""));
            }

        });
    } catch (e) {
        console.log(e);
    }
}; 