var mongoose = require("mongoose");
//mongoose.set('debug', true);
var { DocumentSchema, ProductLabel } = require("../models/model");
var Audit = require('../models/audit.model');
const { responseGenerator } = require('../utility/commonUtils');
const appConfig = require('../config/appConfig');
var { mkdir, deleteFolder, convertDocToPdf } = require('../utility/commonUtils');
var uuid = require('uuid-v4');
var _ = require('lodash');
var path = require('path');
var fileUploadPath = "";
var Promise = require('bluebird');
var fileName = "";
var multer = require('multer');
var convert = require('./../utility/convert');
var basePath = path.resolve("./");
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fileUploadPath)
    },
    filename: (req, file, cb) => {
        fileName = file.originalname;
        cb(null, file.originalname)
    }
});
var upload = multer({ storage: storage }).any();

function uploadFile(req, res, fileUploadPath) {
    return new Promise(function (resolve, reject) {
        var storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, fileUploadPath)
            },
            filename: (req, file, cb) => {
                fileName = file.originalname;
                cb(null, file.originalname)
            }
        });
        var reupload = multer({ storage: storage }).any();
        reupload(req, res, function (err) {
            if (err) {
                return reject(err);
            } else {
                resolve(req.files);
            }
        })
    })
}

function convertToImagePromise(ext, path, callback) {
    return new Promise(function (resolve, reject) {
        convertToImage(ext, path, function (err, pdfPath) {
            if (err) { return reject(err) }
            else { resolve(pdfPath) }
        });
    });
}
exports.reUploadFile = function (req, resp) {
    fileUploadPath = appConfig["FS_PATH"];
    fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];

    function createUUID() {
        return documentId = uuid();
    }
    var id = createUUID();
    fileUploadPath = fileUploadPath + "/" + id;
    mkdir(fileUploadPath);

    uploadFile(req, resp, fileUploadPath)
        .then(function (files) {
            var file = req.files[0];
            var document = {
                documentId: id,
                documentName: file.originalname,
                mimetype: file.mimetype,
                destination: fileVirtualPath + "/" + documentId + "/" + file.originalname,
                documentid: documentId,
                projectId: req.query.projectId,  
                fileType: req.query.fileType,
                version: "0.1",
                location: fileUploadPath,
                uploadedBy: JSON.parse(req.query.uploadedBy),
                uploadedDate: new Date(),
                pdfPath : {
                    location : path.resolve(basePath,file.destination, file.originalname),
                    destination : fileVirtualPath + "/" + documentId + "/" + file.originalname                             
                }
            }
            return Promise.props({
                pdfPath: convertToImagePromise(path.extname(document.documentName), path.resolve(document.location, document.documentName)),
                document: document,
                oldDoc: DocumentSchema.findById(req.query.documentId),
                project: ProductLabel.findById(req.query.projectId)
            });
        }).then(function (result) {
            var pdfPath = result.pdfPath;
            result.document.pdfPath = {
                location: pdfPath,
                destination: fileVirtualPath + "/" + documentId + "/" + path.basename(pdfPath)
            }
            result.document = new DocumentSchema(result.document);

            //soft delete old file
            result.oldDoc._deleted = true;

            //pull the old document id from projects
            var index = _.findIndex(result.project.documents, (doc) => { return doc._id.toString() === result.oldDoc._id.toString() })
            if (index >= 0) {
                result.project.documents.splice(index, 1);
            }
            // On reuoload reset count
            result.project.conflicted = false;
            result.project.conflicts.total= 0;
            result.project.conflicts.types=[];
            //push new document id
            result.project.documents.push(result.document._id);

            return Promise.props({
                document: result.document.save(),
                oldDoc: result.oldDoc.save(),
                project: result.project.save()
            });
        }).then(function (result) {
            resp.json(responseGenerator(0, "Successfully Uploaded", result.document));
            var audit = {
                user: JSON.parse(req.query.uploadedBy),
                description: result.oldDoc.documentName + ' (' + result.oldDoc.fileType+ ')' + ' Replaced By '+ result.document.documentName + ' ( ' + result.document.fileType +' ) Reuploaded',
                project: result.project,
                actionType: 'Document Reupload',
            }
            return Audit.create(audit);
        }).catch(function (err) {
            console.log(err);
            resp.json(responseGenerator(-1, "File Uploaded but unable to update Document Data", ""));
        });
};

exports.uploadFile = function (req, resp) {
    try {
        fileUploadPath = appConfig["FS_PATH"];
        fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];
        //let documentId = uuid();
        function createUUID() {
            return documentId = uuid();
        }
        var basePath = path.resolve("./");
        var id = createUUID();
        fileUploadPath = fileUploadPath + "/" + id;
        mkdir(fileUploadPath);
        upload(req, resp, function (err) {
            if (req.files != null && req.files.length > 0) {
                var file = req.files;
                if (err) {
                    resp.json(responseGenerator(-1, "Unable to Uploaded Document", ""));
                } else {

                    //Seggrgate old and new document schemas here
                    checkForOldDocuments(file, req.query, function (oldDocuments) {
                        for (var i = 0; i < file.length; i++) {
                            var documentId = id;
                            var documentSchema = new DocumentSchema();
                            if (!oldDocuments[file[i].originalname]) {
                                documentSchema.documentName = file[i].originalname;
                                documentSchema.mimetype = file[i].mimetype;
                                documentSchema.destination = fileVirtualPath + "/" + documentId + "/" + file[i].originalname;
                                documentSchema.documentid = documentId;
                                documentSchema.projectId = req.query.projectId;
                                documentSchema.fileType = req.query.fileType;
                                documentSchema.version = "0.1";
                                  documentSchema.pdfPath = {
                                    location : path.resolve(basePath,req.files[i].destination, req.files[i].filename),
                                    destination : fileVirtualPath + "/" + documentId + "/" + file[i].originalname.replace(path.extname(file[i].originalname), ".pdf")
                                    
                                    
                                }  
                            } 
                            else {
                                documentSchema = oldDocuments[file[i].originalname][0];
                                deleteFolder(path.resolve(process.cwd(), documentSchema.location))
                            }
                            // If doc duplicated- remove old doc upload new doc and update below fileds.
                            documentSchema.location = fileUploadPath;
                            documentSchema.uploadedBy = JSON.parse(req.query.uploadedBy);
                            documentSchema.uploadedDate = new Date();
                             convertToImagePromise(path.extname(documentSchema.documentName), path.resolve(documentSchema.location, documentSchema.documentName), function (err, pdfPath) {
                                 documentSchema.pdfPath = {
                                     location: pdfPath,
                                     destination: fileVirtualPath + "/" + documentId + "/" + path.basename(pdfPath)
                                 };
                               
                             }); 
                            documentSchema.save(function (err) {
                                if (err) {
                                    resp.json(responseGenerator(-1, "File Uploaded but unable to update Document Data", ""));
                                } else {
                                    updateProjectLabelInfo(req, resp, documentSchema, req.query.projectId, documentSchema._id, (oldDocuments[documentSchema.documentName] === undefined ));
                                }
                            })
                        }
                    })
                }
            } else {
                resp.json(responseGenerator(-1, "Unable to Uploaded Document", req.files));
            }
        });
    }
    catch (e) {
        console.log(e);
    }
};

function convertToImage(ext, fPath, callback) {

    callback(null, fPath);
   /*  if (ext === '.pdf') {
        callback(null, fPath)
    } else if (['.docx', '.doc'].indexOf(ext) >= 0) {
        convertDocToPdf(fPath)
            .then(function () {
                fPath = fPath.replace(path.extname(fPath), '.pdf')
                callback(null, fPath)
            }).catch(function (err) {
                callback(err);
            })
    } else {
        callback(null, {})
    } */
}


function checkForOldDocuments(files, reqQuery, callback) {
    var filenames = files.map(function (file) {
        return file.originalname
    })
    DocumentSchema.find({ projectId: reqQuery.projectId, fileType: reqQuery.fileType, documentName: filenames, _deleted: false }, function (err, documents) {
        callback(_.groupBy(documents, 'documentName'));
    })
}

exports.viewDocument = function (req, res) {
    try {
        DocumentSchema.findOne({ _id: req.body._id }).exec(function (err, projects) {
            if (err)
                res.json(responseGenerator(-1, "Unable to retrieve Projects list", err));
            else
                res.json(responseGenerator(0, "Successfully retrieved Projects list", projects, ""));
        });
    } catch (e) {
        console.log(e);
    }
};

function updateProjectLabelInfo(req, resp, document, projectId, newDocId, isNew) {
    ProductLabel.findOne({ _id: projectId }).exec(function (err, project) {
        if (err)
            resp.json(responseGenerator(-1, "File uploaded but unable to find the respective project", ""));
        else {
            var productLabel = new ProductLabel();
            productLabel._id = project._id;
            if (isNew) {
                project.documents.push(newDocId);
            }
            productLabel.conflicted = false;
            productLabel.documents = project.documents;
            ProductLabel.findByIdAndUpdate(projectId, { $set: productLabel }, {
                new: false
            }, function (err, request) {
                if (err) {
                    resp.json(responseGenerator(-1, "File Uploaded but unable to update Document Data with Project data", ""));
                } else {
                    resp.json(responseGenerator(0, "Successfully Uploaded", document));
                    //create audit for upload doc
                    var audit = {
                        user: JSON.parse(req.query.uploadedBy),
                        description: document.documentName + ' ( ' + document.fileType +' ) Uploaded',
                        project: request,
                        actionType: 'Upload Document',
                    }
                    return Audit.create(audit);
                }
            });
        }
    });
}


exports.deleteFile = function (req, res, next) {

    return Promise.props({
        project: ProductLabel.findById(req.body.projectId),
        document: DocumentSchema.findById(req.body.documentId)
    }).then(function (result) {
        //pull the old document id from projects
        var index = _.findIndex(result.project.documents, (doc) => { return doc._id.toString() === result.document._id.toString() })
        if (index >= 0) {
            result.project.documents.splice(index, 1);
        }
        result.project.conflicted = false;
        result.document._deleted = true;

        return Promise.props({
            document: result.document.save(),
            project: result.project.save(),
            deletedDocument: DocumentSchema.findById(req.body.documentId)

        })
    }).then(function (result) {
     res.send(responseGenerator(0, 'Document deleted', req.body));
    
     var audit = {
            user: req.body.deletedBy,
            description: result.deletedDocument.documentName + ' ( ' + result.deletedDocument.fileType +' ) Deleted.',
            project: result.project,
            actionType: 'Delete Document',
        }
        return Audit.create(audit);
        
    }).catch(function (err) {
        console.log(err);
        res.json(responseGenerator(-1, "File Uploaded but unable to update Document Data", ""));
    });
}
exports.auditHistory = function (req, res) {
    try {
        //   req.body.project._id = mongoose.Types.ObjectId(req.body.project._id)
        Audit.find(req.body).sort({ modifiedDate: "desc" }).exec(function (err, audit) {
            if (err)
                res.json(
                    responseGenerator(-1, "Unable to retrieve Projects list", err)
                );
            else
                res.json(
                    responseGenerator(
                        0,
                        "Successfully retrieved Audit/Hostory !",
                        audit,
                        ""
                    )
                );
        });
    } catch (e) {
        console.log(e);
    }
};
