var jwt = require('jsonwebtoken');
var config = require('../config/database');
const { ProductLabel, DocumentSchema } = require('../models/model');
var FavouriteSchema = require('../models/favourite.model');
var Audit = require('../models/audit.model');
const { responseGenerator } = require('../utility/commonUtils');
var { mkdir, convertDocToPdf } = require('../utility/commonUtils');
var Promise = require('bluebird');
var path = require('path');
var rp = require('request-promise');
var fs = require('fs');
var uuid = require('uuid-v4');
const appConfig = require('../config/appConfig');
var _ = require('lodash');
require('mongoose').set('debug', true);

var utility = require('./../utility/convert');


exports.newProject = function (req, res) {
    var productLabel = new ProductLabel();
    var conflicts = {
        total: 0,
        types: {
            font: 0,
            content: 0,
            order: 0,
        },
        comments: []
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
        else {
            res.json(responseGenerator(0, "Successfully created Project", productLabel));
            //create audit for new project
            var audit = {
                user: productLabel.createdBy,
                project: productLabel,
                actionType: 'PROJECT_CREATE',
            }
            return Audit.create(audit);
        }
    });
}

exports.getProjects = function (req, res) {
    try {
        ProductLabel.find({}, { 'conflicts.comments': 0 }).lean().sort({ modifiedDate: 'desc' }).exec(function (err, projects) {
            if (err)
                res.json(responseGenerator(-1, "Unable to retrieve Projects list", err));
            else {
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
        ProductLabel.findOne({ _id: req.body._id }, { 'conflicts.comments': 0 }).populate('documents').exec(function (err, project) {
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
    var cfilePath, cVpath;
    var coreDoc;
    return ProductLabel.findOne({ _id: req.body._id }).populate('documents')
        .then(function (_project) {
            project = _project;
            if (project && project.documents != null && project.documents.length > 0) {
                var payload = {
                    "label_filepath": "",
                    "ha_filepath": [],
                    "checklist_filepath": [],
                    "previousLabel_filepath": [],
                    "fontFormat_filepath": [],
                    "reference_filepath": [],
                    "country_name": project.country.name
                };
                var basePath = path.resolve('./');
                payload.file_id = project._id;
                project.documents.forEach(element => {
                    var filePath = path.resolve(basePath, element.location, element.documentName);
                    switch (element.fileType) {
                        case 'Label':
                            coreDoc = element;
                            conflictDoc = _.cloneDeep(coreDoc);
                            var id = uuid();
                            conflictDoc.documentId = id;
                            conflictDoc.fileType = 'CONFLICT';
                            conflictDoc.destination = fileVirtualPath + "/" + id + '/' + element.documentName;
                            conflictDoc.location = fileUploadPath + '/' + id;
                            cVpath = conflictDoc.destination;
                            payload.label_filepath = path.resolve('./', conflictDoc.location, conflictDoc.documentName);
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

                //create a copy of the label file
                var srcPath = path.resolve('./', coreDoc.location, coreDoc.documentName);
                var destPath = path.resolve('./', conflictDoc.location, conflictDoc.documentName);
                if (!fs.existsSync(destPath.replace(conflictDoc.documentName))) {
                    fs.mkdirSync(destPath.replace(conflictDoc.documentName, ""));
                }
                fs.copyFileSync(srcPath, destPath);


                return rp(options);
            } else {
                throw new Error();
            }
        }).then(function (result) {
            if (result.error) {
                throw new Error(result.message);
            }
            cfilePath = result.filepath;
            project.conflicts = result.conflicts;
            project.conflicts.types = _.extend(project.conflicts.types, result.conflicts.conflict_type);
            project.conflicts.comments = _.map(result.comments, function (comment) {
                return _.mapKeys(comment, function (value, key) {
                    switch (key) {
                        case 'comment_text': return "text";
                        case 'conflict_type': return "type";
                        case 'reference_doc': return 'referenceDoc'
                        default: return key;
                    }
                });
            });
            return project.save();
        }).then(function (projectObj) {
            return Promise.props({
                pdf: convertDocToPdf(cfilePath),
                project: projectObj,
                label: DocumentSchema.findById(coreDoc._id)
            });
        }).then(function (result) {
            var cpath = cfilePath.replace(path.extname(cfilePath), ".pdf");
            result.label.pdfPath = {
                location: cpath,
                destination: cVpath.replace(path.extname(cVpath), ".pdf")
            }
            return result.label.save().then(function () {
                return ProductLabel.findById(result.project._id).populate('documents')
            })
        }).then(function (project) {
            res.send(responseGenerator(1, 'Compared', project));
            var audit = {
                user: project.createdBy,
                project: project._id,
                actionType: "COMPARE_DOCUMENT",
                description: {
                    documents: project.documents
                }
            };
            return Audit.create(audit);
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

function getUserFav(req, res, projects) {

    try {
        FavouriteSchema.find({ 'user.userId': req.body.user.userId }).lean().exec(function (err, userFavprojects) {
            if (err)
                res.json(responseGenerator(-1, "Unable to retrieve Projects list", err));
            else {
                var userFav = _.groupBy(userFavprojects, 'project');
                projects.forEach(function (key) {
                    if (userFav[key._id]) {
                        key.favorite = true
                    } else {
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

exports.viewConflictProject = function (req, res) {
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

exports.commentAck = function (req, res) {
    ProductLabel.findById(req.body.projectId, function (err, project) {
        if (err)
            return res.json(
                responseGenerator(-1, "Unable to fetch the Project details", err)
            );
        else {
            var userProject = _.groupBy(req.body.comments, "_id");
            project.conflicts.comments.forEach(function (comment) {
                if (userProject[comment._id]) {
                    comment.action = userProject[comment._id][0].action;
                    comment.actionOn = Date.now();
                    comment.actionBy = req.body.user;
                }
                return comment;
            });
            project.save(function (err) {
                if (err)
                    return res.status(400).send({ success: false, err: err.message });
                else {
                    var audit = {
                        user: req.body.user,
                        project: project,
                        comments: req.body.comments,
                        actionType: "PROJECT_COMMENTS_ACK"
                    };
                    return Audit.create(audit);
                }
            });
        }
        return res.json(
            responseGenerator(
                0,
                "Successfully updated comments Ack",
                req.body.comments,
                0
            )
        );
    });
};
