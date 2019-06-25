var jwt = require("jsonwebtoken"); //for future purpose
const { ProductLabel, DocumentSchema } = require("../models/model");
var FavouriteSchema = require("../models/favourite.model");
var ConflictComment = require("../models/conflict.model");
var Audit = require("../models/audit.model");
var {convertDocToPdf, responseGenerator, log, inputValidator} = require("../utility/commonUtils");
var Promise = require("bluebird");
var path = require("path");
var rp = require("request-promise");
var fs = require("fs");
var uuid = require("uuid-v4");
const appConfig = require("../config/appConfig");
const { PYTHON_URL_CONFLITS, PYTHON_URL_MAPPING , logMessage } = require('../config/appConfig');
var _ = require("lodash");
require("mongoose").set("debug", true);
var _compareAPICallCount=false;
var currentProjName=null;
exports.newProject = (req, res,next) => {
    const { projectName, country, createdBy } = req.body
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
    productLabel.createdOn = new Date();
    //As per UI requirement(Shashank) inserting static conflicts and favorite
    productLabel.conflicts = conflicts;
    productLabel.favorite = 0;
   try {
       
    let inputValidationFields = {
        projectName: 'required',
        country: 'required',
        createdBy: 'required'
    };
    inputValidator(req.body, inputValidationFields).then((result) => {
        if (!result.isValid) {
            throw result.message;
        }
    }).then(() => {
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
    }).catch((err)=>{
        log.error({err:err},logMessage.validatationerror);
        res.json(responseGenerator(-1, "Mandatory fields Missed", ""));
    })
   } catch (err) {  
    log.error({err:err},logMessage.unhandlederror);
    res.json(responseGenerator(-1,"Something went wrong"));
   }

};

exports.getProjects = function (req, res) {
    try {
        log.info({req:req.body.user},"Get all projects");
        ProductLabel.find({}, { "conflicts.comments": 0 })
            .lean()
            .sort({ modifiedDate: "desc" })
            .exec(function (err, projects) {
                if (err){
                    log.error({err:err},logMessage.dberror)
                    res.json(responseGenerator(-1, "Unable to retrieve Projects list", err));    
                }
                else {
                    getUserFav(req, res, projects);
                    //res.json(responseGenerator(0, "Successfully retrieved Projects list", projects, ""));
                }
            });
    } catch (err) {
        log.error({err:err},logMessage.unhandlederror);
        res.json(responseGenerator(-1,"Something went wrong"));
    }
};

exports.viewProject = function (req, res) {
    try {
        let inputValidationFields = {
            _id: 'required',
        };
        inputValidator(req.body, inputValidationFields).then((result) => {
            if (!result.isValid) {
                throw result.message;
            }
        }).then(() => {
            ProductLabel.findOne({ _id: req.body._id }, { "conflicts.comments": 0 })
            .populate("documents")
            .exec(function (err, project) {
                if (err){
                    log.error({err:err},logMessage.dberror);
                    res.json(responseGenerator(-1, "Unable to fetch the Project details", err));      
                } else{
                    res.json(responseGenerator(0,"Successfully retrieved Project details",project,0));
                }    
            });
        }).catch((err)=>{
            log.error({err:err},logMessage.validatationerror);
            res.json(responseGenerator(-1,err.message));
        })
    } catch (err) {
        log.error({err:err},logMessage.unhandlederror);
        res.json(responseGenerator(-1,"Something went wrong"));
    }
};

let documentConversation = (filePath,element)=>{
    Promise.props({           
        referencePdf: convertDocToPdf(_.cloneDeep(filePath)),
        reference: DocumentSchema.findById(element._id)
    }).then((result)=>{
        if(typeof(result)=='string'){
            throw new Error(result);
        }
        var cpath = filePath.replace(path.extname(filePath), ".pdf");
        result.reference.pdfPath = {
            location: cpath,
            destination: result.reference.destination.replace(path.extname(result.reference.destination), ".pdf")
        };
        return result.reference.save()
    }).catch((err)=>{
        log.error({err:err},"Something is went wrong");
    })  
};

var startTime = new Date();
var pythonStartTime = new Date();
exports.compare = function (req, res) {
    log.info({req:req.body},"Conflict/Compare called");
    if(_compareAPICallCount)
    return res.json(
        responseGenerator(
            -1,
             "Currently serving:  " + currentProjName +" ,  request, Please try after some time!"
        )
    );
  
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
    let inputValidationFields = {
        _id: 'required',
    };
    inputValidator(req.body, inputValidationFields).then((result) => {
        if (!result.isValid) {
            throw result.message;
        }
    }).then(()=>{
        _compareAPICallCount=true;       
        ProductLabel.findOne({ _id: req.body._id })
        .populate("documents")       
        .then(function (_project) {
            project = _project;
            if (
                project &&
                project.documents != null &&
                project.documents.length > 0
            ) {
                currentProjName = project.projectName;
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
                             payload.reference_filepath.push(_.cloneDeep(filePath));
                             if(path.extname(filePath)=== '.docx' || path.extname(filePath)=== '.doc'){                               
                                documentConversation(filePath,element);                  
                            } 
                            break;
                        case "Previous Label": 
                            payload.previousLabel_filepath.push(_.cloneDeep(filePath));
                              if(path.extname(filePath)=== '.docx' || path.extname(filePath)=== '.doc'){
                               //documentConversation(filePath,element); 
                            }  
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
       // })
        })
        .then(function (result) {
            console.log("Python End Execution Time : %dms", new Date())
            console.log("Total Python Execution Time : %dms", new Date() - pythonStartTime)
            console.log("Python Conflicts result");
            //console.log(JSON.stringify(result.conflicts));
            if (result.error) {
                log.error({err:result.err},"Python conflict api response")
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
            _compareAPICallCount=false;
            let apath = project.project.conflicts;
            let font  = apath.types.font == undefined ? 0:apath.types.font
            let order = apath.types.order == undefined ? 0:apath.types.order
            let content = apath.types.content == undefined ? 0:apath.types.content
            let spell_grammer = apath.types.spell_grammer == undefined ? 0:apath.types.spell_grammer
            let total = apath.total == undefined ? 0:apath.total

            var audit = {
                user: project.project.createdBy,
                project: project.project,
                actionType: "Compare Documents",
                description: 'Total conflicts: ' +total + ', Font: ' + font+', Order: '+ order+', Content: '+content+', SpellGrammer: '+spell_grammer 
            };
            log.info({req:req.body},"Conflict/Compare ended");
            return Audit.create(audit);
            
        })
        .catch(function (err) {
             log.error({err:err},logMessage.unhandlederror);
            _compareAPICallCount=false;
            return res.json(
                responseGenerator(
                    -1,
                    err.message
                )
            );
            
        });
    }).catch((err)=>{
        _compareAPICallCount=false;
        //log.err({err:result.err},"Python conflict api response")
        console.log("Error",err);
        res.json(
            responseGenerator(
                -1,
                err.id.message
            )
        );
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
    } catch (err) { 
        log.error({err:err},logMessage.unhandlederror);
        res.json(responseGenerator(-1,"Something went wrong"));
    }
}

exports.viewConflictProject = function (req, res) {
    var response = {};
    try {
        let inputValidationFields = {
            _id: 'required',
        };
        inputValidator(req.body, inputValidationFields).then((result) => {
            if (!result.isValid) {
                throw result.message;
            }
        }).then(() => {
            ProductLabel.findOne({ _id: req.body._id })
            .populate("documents")
            .exec(function (err, project) {
                response.project = project;
                ConflictComment.find({ project_id: req.body._id, _deleted: false }, function (err, comments) {
                    response.comments = comments;
                    if (err){
                        log.error({err:err},logMessage.dberror);
                        res.json(responseGenerator(-1, "Unable to fetch the Project details", err));
                    }    
                    else{
                        res.json(responseGenerator(0,"Successfully retrieved Project details",response,0));
                    }                                                                 
                })
            });
        }).catch((err)=>{
            log.error({err:err},logMessage.validatationerror);
            res.json(responseGenerator(-1,err.message));
        })

    } catch (err) {
        log.error({err:err},logMessage.unhandlederror);
        res.json(responseGenerator(-1,"Something went wrong"));
    }
};

exports.commentAck = function (req, res) {
    var project, pythonComments = [];
    try {
        
        let inputValidationFields = {
            projectId: 'required',
        };
        inputValidator(req.body, inputValidationFields).then((result) => {
            if (!result.isValid) {
                throw result.message;
            }
        }).then(() => {
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
            log.error({err:err},logMessage.unhandlederror);
            return res.json(responseGenerator(-1, "Unable to fetch the Project details", err));
                
      });
    }).catch((err)=>{
        log.error({err:err},logMessage.validatationerror);
        res.json(responseGenerator(-1,err.message));
        })
    } catch (err) {
        log.error({err:err},logMessage.unhandlederror);
        res.json(responseGenerator(-1,"Something went wrong"));
    } 
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
    try {
       
        let inputValidationFields = {
            label_filepath: 'required',
        };
        inputValidator(req.body, inputValidationFields).then((result) => {
            if (!result.isValid) {
                throw result.message;
            }
        }).then(() => {            
            return rp(options).then(function(response){
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
                log.error({err:err},logMessage.unhandlederror);
                res.json(responseGenerator(-1,"Something went wrong! Try again"));
            });

        }).catch((err)=>{
        log.error({err:err},logMessage.validatationerror);
        res.json(responseGenerator(-1,err.message));
        }) 
    } catch (err) {
        log.error({err:err},logMessage.unhandlederror);
        res.json(responseGenerator(-1,"Something went wrong"));
    }

    }

