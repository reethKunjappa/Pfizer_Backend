var jwt = require("jsonwebtoken");
var config = require("../config/database");
const { ProductLabel, DocumentSchema } = require("../models/model");
var FavouriteSchema = require("../models/favourite.model");
var mappingSpecScema = require("../models/mappingspec.model");
var ConflictComment = require("../models/conflict.model");
var Audit = require("../models/audit.model");
var { mkdir, convertDocToPdf, responseGenerator } = require("../utility/commonUtils");
var Promise = require("bluebird");
var path = require("path");
var rp = require("request-promise");
var fs = require("fs");
var uuid = require("uuid-v4");
const appConfig = require("../config/appConfig");
const { PYTHON_URL_CONFLITS, PYTHON_URL_MAPPING } = require('../config/appConfig');
var _ = require("lodash");
require("mongoose").set("debug", true);

var utility = require("./../utility/convert");

exports.newProject = (req, res,next) => {
    const { projectName, country, createdBy, ownerName } = req.body
    var productLabel = new ProductLabel();
    var conflicts = {
        total: 0,
        types: {
            font: 0,
            content: 0,
            order: 0
        },
        comments: []
    };
    productLabel.projectName = projectName;
    productLabel.country = country;
    productLabel.createdBy = createdBy;
    productLabel.ownerName = ownerName;
    productLabel.createdOn = new Date();
    //As per UI requirement(Shashank) inserting static conflicts and favorite
    productLabel.conflicts = conflicts;
    productLabel.favorite = 0;
    if(projectName && country && createdBy){
    productLabel.save( (err) => {
        if (err) res.json(responseGenerator(-1, "Project already exists.", err));
        else {
            res.json(
                responseGenerator(0, "Project created Successfully", productLabel)
            );
            //create audit for new project
            var audit = {
                user: productLabel.createdBy,
                project: productLabel,
                comments : "Project created",
                description : productLabel.projectName + ' Project Created.',
                actionType: "Create Project"
            };
            return Audit.create(audit);
        }
    });
}else{
        res.json(responseGenerator(-1, "Mandatory fields Missed", ""));
}
};

exports.getProjects = function (req, res) {
    try {
        ProductLabel.find({}, { "conflicts.comments": 0 })
            .lean()
            .sort({ modifiedDate: "desc" })
            .exec(function (err, projects) {
                if (err)
                    res.json(
                        responseGenerator(-1, "Unable to retrieve Projects list", err)
                    );
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
        ProductLabel.findOne({ _id: req.body._id }, { "conflicts.comments": 0 })
            .populate("documents")
            .exec(function (err, project) {
                if (err)
                    res.json(
                        responseGenerator(-1, "Unable to fetch the Project details", err)
                    );
                else
                    res.json(
                        responseGenerator(
                            0,
                            "Successfully retrieved Project details",
                            project,
                            0
                        )
                    );
            });
    } catch (e) {
        console.log(e);
    }
};
var startTime = new Date();
var pythonStartTime = new Date();
exports.compare = function (req, res) {
    startTime = new Date();
    var project = {};
    var conflictDoc = {
        type: "CONFLICT"
    };
    var fileUploadPath = appConfig["FS_PATH"];
    var fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];
    var cfilePath, cVpath;
    var coreDoc;
    var mapSpecApIPayload = {};
    var docXtoPdf= [];

    return ProductLabel.findOne({ _id: req.body._id })
        .populate("documents")
        .then(function (_project) {
            project = _project;
            if (
                project &&
                project.documents != null &&
                project.documents.length > 0
            ) {
                var payload = {
                    label_filepath: "",
                    ha_filepath: [],
                    checklist_filepath: [],
                    previousLabel_filepath: [],
                    fontFormat_filepath: [],
                    reference_filepath: [],
                    country_name: project.country.name,
                    project_id: project._id
                };
                var basePath = path.resolve("./");
                mapSpecApIPayload.project_id = project._id;
                project.documents.forEach(element => {
                    var filePath = path.resolve(
                        basePath,
                        element.location,
                        element.documentName
                    );
                    switch (element.fileType) {
                        case "Label":
                            coreDoc = element;
                            conflictDoc = _.cloneDeep(coreDoc);
                            var id = uuid();
                            payload.file_id = element._id;
                            conflictDoc.documentId = id;

                            conflictDoc.fileType = "CONFLICT";
                            conflictDoc.destination =
                                fileVirtualPath + "/" + id + "/" + element.documentName;
                            conflictDoc.location = fileUploadPath + "/" + id;
                            cVpath = conflictDoc.destination;
                            payload.label_filepath = path.resolve("./", conflictDoc.location, conflictDoc.documentName);
                            mapSpecApIPayload.file_id = element._id;
                            conflictDoc["originalPath"] ={
                                location : conflictDoc.pdfPath.location,
                                destination : conflictDoc.destination,
                            }
                            break;
                        case "Reference":
                            mapSpecApIPayload.ref_id = element._id;
                            refDoc = element;  //DocumentSchema.findById(coreDoc._id)
                            payload.reference_filepath.push(filePath);
                            var cloneFilePath =  _.cloneDeep(filePath)
                            console.log("****** CloneDeep: ", cloneFilePath)
                            //Creating Array of obj to convert to pdf
                             if(path.extname(filePath)=== '.docx' || path.extname(filePath)=== '.doc'){                               
                                        Promise.props({
                                            referencePdf: convertDocToPdf(cloneFilePath),
                                            reference: DocumentSchema.findById(element._id)
                                        }).then(function(result){
                                            console.log(result)
                                            var cpath = filePath.replace(path.extname(filePath), ".pdf");
                                            result.reference.pdfPath = {
                                                location: cpath,
                                                destination: cVpath.replace(path.extname(cVpath), ".pdf")
                                            };
                                            result.reference.save();
                                        })            
                            } 
                            break;
                        case "Previous Label":
                            payload.previousLabel_filepath.push(filePath);
                            //Creating Array of obj to convert to pdf
                            /*  if(path.extname(filePath)=== '.docx' || path.extname(filePath)=== '.doc'){
                                docXtoPdf.push({"previousLabelDoc": filePath})
                                Promise.props({
                                    referencePdf: convertDocToPdf(filePath),
                                    previousLabel: DocumentSchema.findById(element._id)
                                }).then(function(result){
                                    var cpath = filePath.replace(path.extname(filePath), ".pdf");
                                    result.previousLabel.pdfPath = {
                                        location: cpath,
                                        destination: cVpath.replace(path.extname(cVpath), ".pdf")
                                    };
                                    result.previousLabel.save();
                                })
                            } */ 
                            break;
                        case "HA Guidelines":
                            payload.ha_filepath.push(filePath);
                            //Creating Array of obj to convert to pdf
                            /* if(path.extname(filePath)=== '.docx' || path.extname(filePath)=== '.doc'){
                                docXtoPdf.push({"haGuidelinesDoc": filePath})
                            } */
                            break;
                        case "Pfizer Checklist":
                            payload.checklist_filepath.push(filePath);
                            //Creating Array of obj to convert to pdf
                            /* if(path.extname(filePath)=== '.docx' || path.extname(filePath)=== '.doc'){
                                docXtoPdf.push({"pfizerChecklistDoc": filePath})
                            } */
                            break;
                        case "Font Format Spec":
                            payload.fontFormat_filepath.push(filePath);
                            //Creating Array of obj to convert to pdf
                            /* if(path.extname(filePath)=== '.docx' || path.extname(filePath)=== '.doc'){
                                docXtoPdf.push({"fontFormatSpecDoc": filePath})
                            } */
                            break;
                    }
                });

                
                const options = {
                    uri: PYTHON_URL_CONFLITS,
                    method: "POST",
                    json: true,
                    body: payload,
                    headers: {
                        "Content-Type": "application/json"
                    }
                };
                //create a copy of the label file
                var srcPath = path.resolve("./", coreDoc.location, coreDoc.documentName
                );
                var destPath = path.resolve(
                    "./",
                    conflictDoc.location,
                    conflictDoc.documentName
                );
                if (!fs.existsSync(destPath.replace(conflictDoc.documentName))) {
                    fs.mkdirSync(destPath.replace(conflictDoc.documentName, ""));
                }
                fs.copyFileSync(srcPath, destPath);
                pythonStartTime = new Date();
                console.log("Python Start Execution Time : %dms ",pythonStartTime)
                console.log("Python Payload: ")
                console.log(JSON.stringify(options));
                //console.log(payload)
                return rp(options);
            } else {
                throw new Error();
            }
        })
        .then(function (result) {
            console.log("Python End Execution Time : %dms", new Date())
            console.log("Total Python Execution Time : %dms", new Date() - pythonStartTime)
            console.log("Python Conflicts result");
            //console.log(JSON.stringify(result.conflicts));
            if (result.error) {
                throw new Error(result.message);
            }

            cfilePath = result.filepath;
            project.conflicts = result.conflicts;
            project.conflicts.types = result.conflicts.conflict_type;
            project.conflicted = true;
            var project_id = req.body._id;

            return Promise.props({
                startTime : new Date(),
                comments: ConflictComment.find({ project_id: project_id, _deleted: false }),
                project: project.save()
            })

        })
        .then(function (result) {
            console.log("Node comments fetching from DB : %dms", new Date()-result.startTime);
            return Promise.props({
                project: result.project,
                label: DocumentSchema.findById(coreDoc._id),
                comments: result.comments,
                startTime
            });
        })
        .then(function (projectObj) {
            return Promise.props({
                startTime : new Date(),
                pdf: convertDocToPdf(cfilePath),
                project: projectObj.project,
                label: projectObj.label,
                comments: projectObj.comments
            });
        })
        .then(function (result) {
            console.log("Convert from doc to pdf python : %dms", new Date()- result.startTime);
            var cpath = cfilePath.replace(path.extname(cfilePath), ".pdf");
            result.label.pdfPath = {
                location: cpath,
                destination: cVpath.replace(path.extname(cVpath), ".pdf")
            };
            result.label.labelCopy = {
                location: cfilePath,
                destination: cVpath
            };

            result.label.originalPath = conflictDoc.originalPath;
            return Promise.props({
                project: result.label.save().then(function () {
                    return ProductLabel.findById(result.project._id).populate("documents");
                }),
                comments: result.comments
            });

        })
        .then(function (project) {
            console.log('Total Execution time: %dms', new Date()- startTime);
            res.send(responseGenerator(0, "Compared", project));
            var font  = project.project.conflicts.types.font == undefined ? 0:project.project.conflicts.types.font
            var order = project.project.conflicts.types.order == undefined ? 0:project.project.conflicts.types.order
            var content = project.project.conflicts.types.content == undefined ? 0:project.project.conflicts.types.content
            var spell_grammer = project.project.conflicts.types.spell_grammer == undefined ? 0:project.project.conflicts.types.spell_grammer
            var total = project.project.conflicts.total == undefined ? 0:project.project.conflicts.total

            var audit = {
                user: project.project.createdBy,
                project: project.project,
                actionType: "Compare Documents",
                description: 'Total conflicts: ' +total + ', Font: ' + font+', Order: '+ order+', Content: '+content+', SpellGrammer: '+spell_grammer 
            };
            return Audit.create(audit);
        })
        .catch(function (err) {
            //console.log(err);
            return res.status(400).send({ success: false, err: err.message });
        });
};
exports.updateProject = function (req, res) {
    var productLabel = new ProductLabel(req.body);
    return ProductLabel.findByIdAndUpdate(
        req.body._id,
        { $set: productLabel },
        { new: false }
    )
        .then(function () {
            res.json(
                responseGenerator(
                    0,
                    "Successfully updated the Project details",
                    productLabel,
                    0
                )
            );
        })
        .catch(function (err) {
            res.json(
                responseGenerator(-1, "Unable to update the Project details", err)
            );
        });
};

function getUserFav(req, res, projects) {
    try {
        FavouriteSchema.find({ "user.userId": req.body.user.userId })
            .lean()
            .exec(function (err, userFavprojects) {
                if (err)
                    res.json(
                        responseGenerator(-1, "Unable to retrieve Projects list", err)
                    );
                else {
                    var userFav = _.groupBy(userFavprojects, "project");
                    projects.forEach(function (key) {
                        if (userFav[key._id]) {
                            key.favorite = true;
                        } else {
                            key.favorite = false;
                        }
                        return key;
                    });
                    res.json(
                        responseGenerator(
                            0,
                            "Successfully retrieved Projects list",
                            projects,
                            ""
                        )
                    );
                }
            });
    } catch (e) {
        console.log(e);
    }
}

exports.viewConflictProject = function (req, res) {
    var response = {};
    try {
        ProductLabel.findOne({ _id: req.body._id })
            .populate("documents")
            .exec(function (err, project) {
                response.project = project;
                ConflictComment.find({ project_id: req.body._id, _deleted: false }, function (err, comments) {
                    response.comments = comments;
                    if (err)
                        res.json(
                            responseGenerator(-1, "Unable to fetch the Project details", err)
                        );
                    else
                        res.json(
                            responseGenerator(
                                0,
                                "Successfully retrieved Project details",
                                response,
                                0
                            )
                        );
                })
            });
    } catch (e) {
        console.log(e);
    }
};

exports.commentAck = function (req, res) {
    var project, pythonComments = [];
    ProductLabel.findById(req.body.projectId).populate('documents')
        .then(function (_project) {

            project = _project
            var labelDoc = _.find(project.documents, { fileType: 'Label' });
            var payload = {
                "label_filepath": labelDoc.labelCopy.location,
                "file_id": labelDoc.id,
                "project_id": req.body.projectId,
                "comments": req.body.comments
            };
            const options = {
                uri: PYTHON_URL_CONFLITS+"/accept",
                method: "POST",
                json: true,
                body: payload,
                headers: {
                    "Content-Type": "application/json"
                }
            };
            console.log("CONFLICTS ACCEPT INPUT");
            console.log(JSON.stringify(options));
            return rp(options);
        }).then(function (pyresponse) {
            return Promise.props({
                pdf: convertDocToPdf(pyresponse.label_filepath),
                cfilePath: pyresponse.label_filepath
            });
        }).then(function (result) {
            var cpath = result.cfilePath.replace(path.extname(result.cfilePath), ".pdf");
            var label = _.find(project.documents, { fileType: 'Label' });
            label.pdfPath = {
                location: cpath,
                destination: label.labelCopy.destination.replace(path.extname(label.documentName), ".pdf")
            };
            var comments = req.body.comments;
            var acceptedComment = [];
            var rejectedComment = [];
            var acceptedCommentData = [];
            var rejectedCommentData = [];
            var orderCount = 0;
            var fontSizeCount = 0;
            var grammarSpellingCount = 0;
            var orderCount = 0;
            var contentCount = 0;
            comments.forEach(function (comment) {
                if (comment.action == "ACCEPT") {
                    acceptedComment.push(comment.comment_id);
                    acceptedCommentData.push(comment.comment_text);
                } else if (comment.action == "REJECT") {
                    rejectedComment.push(comment.comment_id);
                    rejectedCommentData.push(comment.comment_text);
                }
               
                switch (comment.conflict_type) {
                    case "FONT_SIZE":
                        fontSizeCount++;
                        break;
                    case "FONT_NAME":
                        fontSizeCount++;
                        break;    
                    case "GRAMMAR_SPELLING":
                        grammarSpellingCount++;
                        break;
                    case "ORDER":
                        orderCount++;
                        break;
                    case "CONTENT":
                        contentCount++;
                        break;
                };

            });
            console.log("After pushing into Array------------------")
            console.log(acceptedCommentData)
            console.log(rejectedCommentData)
            console.log("---------------------------------------")
            project.conflicts.total = project.conflicts.total - (fontSizeCount + grammarSpellingCount + orderCount + contentCount);
            project.conflicts.types.font = project.conflicts.types.font - fontSizeCount;
            project.conflicts.types.spell_grammer = project.conflicts.types.spell_grammer - grammarSpellingCount;
            project.conflicts.types.content = project.conflicts.types.content - contentCount;
            project.conflicts.types.order = project.conflicts.types.order - orderCount;
            return Promise.props({
                accept_modified: ConflictComment.updateMany({
                    "comment_id": { "$in": acceptedComment }
                },
                    { "$set": { "_deleted": true, "action": "ACCEPT" } }
                ),
                label: label.save(),
                project: project.save(),
                reject_modified: ConflictComment.updateMany({
                    "comment_id": { "$in": rejectedComment }
                },
                    { "$set": { "_deleted": true, "action": "REJECT" } }
                ),
                rejectedCommentData:rejectedCommentData,
                acceptedCommentData:acceptedCommentData

            })
        })
        .then(function (result) {
            console.log("Accept_modifed/RejectModified-------------------");
            console.log(result.acceptedCommentData)
            console.log(result.rejectedCommentData)
            var audit = {};

           switch (req.body.commentAction.action){
            case 'acceptAll':
                    audit = {
                        user: req.body.user,
                        project: result.project,
                        comments: result.acceptedCommentData,
                        actionType: "Accept All Conflicts",
                        description : result.acceptedCommentData.length +' Comments Accepted of type ' + req.body.commentAction.type
                    };
                break;
            case 'rejectAll':
                    audit = {
                        user: req.body.user,
                        project: result.project,
                        comments: result.rejectedCommentData,
                        actionType: "Reject All Conflicts",
                        description: result.rejectedCommentData.length +' Comments Rejected of type ' + req.body.commentAction.type
                    };
                break;
            case 'accept/reject':
                audit = {
                    user: req.body.user,
                    project: result.project,
                    comments: result.acceptedCommentData.concat(result.rejectedCommentData),
                    actionType: "Accept/Reject Conflicts",
                    description: result.acceptedCommentData.length +' Accepted, ' + result.rejectedCommentData.length +' Rejected'
                };
                break;    
           }
            return Audit.create(audit);
        })
        .then(function (audit) {
            return Promise.props({
                comments: ConflictComment.find({ project_id: req.body.projectId, _deleted: false }),
                project: ProductLabel.findById(req.body.projectId).populate('documents')
            });

        })
        .then(comments_ => {
            return res.json(
                responseGenerator(
                    0,
                    "Successfully updated comments Ack",
                    comments_,
                    0
                )
            );
        })
        .catch(function (err) {
            return res.json(
                responseGenerator(-1, "Unable to fetch the Project details", err)
            );
        }); 
 };


exports.getMappingSpec = function (req, res) {
    
    const options = {
        //ToDO: Update on getting the ip address
        uri: PYTHON_URL_MAPPING,
        method: "POST",
        json: true,
        body: req.body,
        headers: {
            "Content-Type": "application/json"
        }
    };

    return rp(options)
        .then(function(response){
            return Promise.props({
                response: response,
                project: ProductLabel.findById(req.body._id)
            })
        })
        .then(function (response) {
            var audit = {
                user: req.body.user,
                description: 'Mapping Spec Genearted Successfully.',
                project: response.project,
                actionType: 'Generate Mapping Spec',
            }
            Audit.create(audit);
            return res.send({ result: response.response, status: { code: 0, message: "Get all Mapping Specs" } });
        })
        .catch(function (err) {
            return res.status(400).send({ success: false, err: err.message });
        });

    }

