var mongoose = require("mongoose");
//mongoose.set('debug', true);
var { DocumentSchema, ProductLabel } = require("../models/model");
const { responseGenerator } = require('../utility/commonUtils');
const appConfig = require('../config/appConfig');
var { mkdir, deleteFolder } = require('../utility/commonUtils');
var uuid = require('uuid-v4');
var _ = require('lodash');
var path = require('path');
var fileUploadPath = "";
var fileName = "";
var multer = require('multer');
var convert = require('./../utility/convert');

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

exports.uploadFile = function (req, resp) {
    try {
        fileUploadPath = appConfig["FS_PATH"];
        fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];
        //let documentId = uuid();
        function createUUID() {
            return documentId = uuid();
        }
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
                            } else {
                                documentSchema = oldDocuments[file[i].originalname][0];
                                deleteFolder(path.resolve(process.cwd(), documentSchema.location))
                            }
                            documentSchema.location = fileUploadPath;
                            documentSchema.uploadedBy = JSON.parse(req.query.uploadedBy);
                            documentSchema.uploadedDate = new Date();

                            convertToImage(path.extname(documentSchema.documentName), path.resolve(documentSchema.location, documentSchema.documentName), function (err, imagePaths) {
                                documentSchema.imagePaths = _.map(imagePaths, function (imagePath) {
                                    return {
                                        location: imagePath,
                                        destination: fileVirtualPath + "/" + documentId + "/" + path.basename(imagePath)
                                    }
                                });
                                documentSchema.save(function (err) {
                                    if (err) {
                                        resp.json(responseGenerator(-1, "File Uploaded but unable to update Document Data", ""));
                                    } else {
                                        updateProjectLabelInfo(req, resp, documentSchema, req.query.projectId, documentSchema._id, (oldDocuments[documentSchema.documentName] === undefined));
                                    }
                                });
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

function convertToImage(ext, path, callback) {
    if (ext === '.pdf') {
        convert.convertPdfToImage(path, callback)
    } else if (ext === '.docx') {
        convert.convertDocToImage(path, callback)
    } else {
        callback(null, [])
    }
}


function checkForOldDocuments(files, reqQuery, callback) {
    var filenames = files.map(function (file) {
        return file.originalname
    })
    DocumentSchema.find({ projectId: reqQuery.projectId, fileType: reqQuery.fileType, documentName: filenames }, function (err, documents) {
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
            productLabel.documents = project.documents;
            ProductLabel.findByIdAndUpdate(projectId, { $set: productLabel }, {
                new: false
            }, function (err, request) {
                if (err) {
                    resp.json(responseGenerator(-1, "File Uploaded but unable to update Document Data with Project data", ""));
                } else {
                    resp.json(responseGenerator(0, "Successfully Uploaded", document));

                    //create audit for upload doc
                    /*  {
                        user: { },
                        project: '7662347823648',
                            actionType: 'DOCUMENT_UPLOAD',
                                description: {
                            "documentId": "asdasds"
                        }
                    } */
                    var audit = {
                        user: productLabel.uploadedBy,
                        description: document,
                        actionType: 'DOCUMENT_UPLOAD',
                    }
                    return Audit.create(audit);
                }
            });
        }
    });
}
