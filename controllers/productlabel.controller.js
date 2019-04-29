var jwt = require("jsonwebtoken");
var config = require("../config/database");
const { ProductLabel, DocumentSchema } = require("../models/model");
var FavouriteSchema = require("../models/favourite.model");
var mappingSpecScema = require("../models/mappingspec.model");
var ConflictComment = require("../models/conflict.model");
var Audit = require("../models/audit.model");
const { responseGenerator } = require("../utility/commonUtils");
var { mkdir, convertDocToPdf } = require("../utility/commonUtils");
var Promise = require("bluebird");
var path = require("path");
var rp = require("request-promise");
var fs = require("fs");
var uuid = require("uuid-v4");
const appConfig = require("../config/appConfig");
var _ = require("lodash");
require("mongoose").set("debug", true);

var utility = require("./../utility/convert");

exports.newProject = function (req, res) {
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
    productLabel.projectName = req.body.projectName;
    productLabel.country = req.body.country;
    productLabel.createdBy = req.body.createdBy;
    productLabel.ownerName = req.body.ownerName;
    productLabel.createdOn = new Date();
    //As per UI requirement(Shashank) inserting static conflicts and favorite
    productLabel.conflicts = conflicts;
    productLabel.favorite = 0;

    productLabel.save(function (err) {
        if (err) res.json(responseGenerator(-1, "Project already exists.", err));
        else {
            res.json(
                responseGenerator(0, "Successfully created Project", productLabel)
            );
            //create audit for new project
            var audit = {
                user: productLabel.createdBy,
                project: productLabel,
                actionType: "PROJECT_CREATE"
            };
            return Audit.create(audit);
        }
    });
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
exports.compare = function (req, res) {
    var project = {};
    var conflictDoc = {
        type: "CONFLICT"
    };
    var fileUploadPath = appConfig["FS_PATH"];
    var fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];
    var cfilePath, cVpath;
    var coreDoc;
    var mapSpecApIPayload = {};

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

                            break;
                        case "Reference":
                            mapSpecApIPayload.ref_id = element._id;
                            payload.reference_filepath.push(filePath);
                            break;
                        case "Previous Label":
                            payload.reference_filepath.push(filePath);
                            break;
                        case "HA Guidelines":
                            payload.ha_filepath.push(filePath);
                            break;
                        case "Pfizer Checklist":
                            payload.checklist_filepath.push(filePath);
                            break;
                        case "Font Format Spec":
                            payload.fontFormat_filepath.push(filePath);
                            break;
                    }
                });
             console.log(JSON.stringify(payload))
                const options = {
                    uri: "http://54.164.151.252:3001/",
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
               console.log("*************** CONFLICT PYTHON INPUT **********************")
               console.log(options);
                return rp(options);
            } else {
                throw new Error();
            }
        })
        .then(function (result) {
            console.log("*************** CONFLICT PYTHON OUTPUT **********************")
            console.log(result);
            console.log("SPELL_GRA*****************", result.err_commenets);
            if (result.error) {
                throw new Error(result.message);
         }
        
            cfilePath = result.filepath;
            project.conflicts = result.conflicts;
            project.conflicts.types = result.conflicts.conflict_type;
            /*   _.extend(
                project.conflicts.types,
                result.conflicts.conflict_type
            ); */
           // console.log(project.conflicts.types )
            project.conflicted = true;

        var project_id = req.body._id;

           return Promise.props({ comments: ConflictComment.find({ project_id: project_id , _deleted : false}),
           project : project.save()})
              
        })
        .then(function (result) {
                   console.log("Result************");
            return Promise.props({
                project: result.project,
                label: DocumentSchema.findById(coreDoc._id),
                comments : result.comments
                // mappingSpec: generateMappingSpec(mapSpecApIPayload)
            }); 
            }) 
        .then(function (projectObj) {
            console.log("convertDocToPdf******************");
            return Promise.props({
                pdf: convertDocToPdf(cfilePath),
                project: projectObj.project,
                label: DocumentSchema.findById(coreDoc._id),
                comments : projectObj.comments
                // mappingSpec: generateMappingSpec(mapSpecApIPayload)
            });
        })
        .then(function (result) {
            
            var cpath = cfilePath.replace(path.extname(cfilePath), ".pdf");
            result.label.pdfPath = {
                location: cpath,
                destination: cVpath.replace(path.extname(cVpath), ".pdf")
            };
            result.label.labelCopy = {
                location: cfilePath,
                destination: cVpath
            }; 
            return Promise.props({
                project:  result.label.save().then(function () {
                    return ProductLabel.findById(result.project._id).populate("documents");
                }),
                comments : result.comments
                // mappingSpec: generateMappingSpec(mapSpecApIPayload)
            });
            
        })
        .then(function (project) {
        
            res.send(responseGenerator(1, "Compared", project));
            var audit = {
                user: project.project.createdBy,
                project: project.project,
                actionType: "COMPARE_DOCUMENT",
                description: {
                    documents: project.project.documents
                }
            };
            return Audit.create(audit);
        })
        .catch(function (err) {
            console.log(err);
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
    var response ={};
    try {
        ProductLabel.findOne({ _id: req.body._id })
            .populate("documents")
            .exec(function (err, project) {
                response.project = project;
                ConflictComment.find({ project_id: req.body._id,_deleted:false },function(err,comments){
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
                        //"label_filepath":path.resolve('./', labelDoc.labelCopy.location),
                        "label_filepath": path.resolve('./', labelDoc.location, labelDoc.documentName),
                        "file_id": labelDoc.id,
                        "project_id":req.body.projectId,
                        "comments": req.body.comments
                        };
                        console.log("*************** ACCEPT/REJECT PYTHON INPUT **********************")
                       
                        const options = {
                        uri: "http://54.164.151.252:3001/accept",
                        method: "POST",
                        json: true,
                        body: payload,
                        headers: {
                        "Content-Type": "application/json"
                        }
                        };
                        return rp(options);
            }).then(function (pyresponse) {
                console.log("*************** ACCEPT/REJECT PYTHON RESPONSE **********************")
                console.log(JSON.stringify(pyresponse));
                        return Promise.props({
                            pdf: convertDocToPdf(pyresponse.label_filepath),
                            cfilePath: pyresponse.label_filepath
                        });
                        //return convertDocToPdf(pyresponse.label_filepath);
            }).then(function (result) {
                    var cpath = result.cfilePath.replace(path.extname(result.cfilePath), ".pdf");
                    var label = _.find(project.documents, { fileType: 'Label' });

                    label.pdfPath = {
                    location: cpath,
                    destination: 'view/'+label.documentid+'/'+ label.documentName.replace(path.extname(label.documentName), ".pdf")
                    };

                    var comments = req.body.comments;
                    var acceptedComment =[];
                    var rejectedComment = [];
                    comments.forEach(function (comment) {
                        if(comment.action == "ACCEPT"){
                            acceptedComment.push(comment.comment_id);
                        }else if(comment.action == "REJECT"){
                            rejectedComment.push(comment.comment_id);
                        }
                    });
                        return Promise.props({
                            accept_modified:  ConflictComment.updateMany({
                                "comment_id": { "$in": acceptedComment }
                            },
                                { "$set": { "_deleted": true,"action" :"ACCEPT" } }
                            ),
                            label: label.save(),
                            reject_modified:  ConflictComment.updateMany({
                                "comment_id": { "$in": rejectedComment }
                            },
                                { "$set": { "_deleted": true,"action" :"REJECT" } }
                            )
                        })
                        
         
                    // });
                
           
            })
            .then(function (result) {
                console.log(result.accept_modified, result.reject_modified)
                        var audit = {
                        user: req.body.user,
                        project: result.project,
                        comments: req.body.comments,
                        actionType: "PROJECT_COMMENTS_ACK"
                        };
                        return Audit.create(audit);
                        })
            .then(function (audit) {
                return Promise.props({ 
                    comments : ConflictComment.find({project_id: req.body.projectId, _deleted: false}),
                    project : ProductLabel.findById(req.body.projectId).populate('documents')
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
                console.log("Ack catch Err-------------------")
                console.log(err);
            return res.json(
            responseGenerator(-1, "Unable to fetch the Project details", err)
            );
            });   
        };


    exports.getMappingSpec = function (req, res) {
        console.log("Mapping Speic =========================================================");
        const options = {
            //ToDO: Update on getting the ip address
            uri: "http://54.164.151.252:3000",
            method: "POST",
            json: true,
            body: req.body,
            headers: {
                "Content-Type": "application/json"
            }
        };
        
        return rp(options)    
        .then(function (response) {
            console.log("MappingSepc*************************");
            console.log(response);
            res.send({ result: response, status: { code: 0, message: "Get all Mapping Specs" } });
        })
        .catch(function (err) {
            res.status(400).send({ success: false, err: err.message });
        });

    }

    function generateMappingSpec(payload) {
        const options = {
            //ToDO: Update on getting the ip address
            uri: "http://54.164.151.252:3000",
            method: "POST",
            json: true,
            body: payload,
            headers: {
                "Content-Type": "application/json"
            }
        };
        return rp(options);
    }
