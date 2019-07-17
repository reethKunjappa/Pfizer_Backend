var mongoose = require("mongoose");
//mongoose.set('debug', true);
var { DocumentSchema } = require("../models/model");
var countryConfigModel = require('../models/countryConfig.model')
var ruleConfigModel = require('../models/rulesConfig.model')
const { responseGenerator } = require("../utility/commonUtils");
const appConfig = require("../config/appConfig");
var { mkdir } = require("../utility/commonUtils");
var uuid = require("uuid-v4");
var _ = require("lodash");
var fileUploadPath = "";
var Promise = require("bluebird");
var multer = require("multer");
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fileUploadPath);
    },
    filename: (req, file, cb) => {
        fileName = file.originalname;
        cb(null, file.originalname);
    }
});
var upload = multer({ storage: storage }).any();

exports.configFileUpload = function (req, res) {
    try {
        fileUploadPath = appConfig["FS_PATH"];
        fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];
        function createUUID() {
            return (documentId = uuid());
        }
        var id = createUUID();
        fileUploadPath = fileUploadPath + "/" + id;
        mkdir(fileUploadPath);

        upload(req, res, function (err) {
            if (req.files != null && req.files.length > 0) {
                var file = req.files;
                if (err) {
                    res.json(responseGenerator(-1, "Unable to Uploaded Document", ""));
                } else {
                    for (var i = 0; i < file.length; i++) {
                        var documentId = id;
                        var documentSchema = new DocumentSchema();
                        documentSchema.documentName = file[i].originalname;
                        documentSchema.destination =
                        fileVirtualPath + "/" + documentId + "/" + file[i].originalname;
                        documentSchema.location = fileUploadPath;
                        documentSchema.documentid = documentId;
                        documentSchema.countryConfig_id = req.query.projectId;
                        documentSchema.uploadedBy = JSON.parse(req.query.uploadedBy);
                        documentSchema.fileType = req.query.fileType;
                        documentSchema.save(function (err) {
                            if (err) {
                                res.json(
                                    responseGenerator(
                                        -1,
                                        "File Uploaded but unable to update Document Data",
                                        ""
                                    )
                                );
                            } else {
                                updateDocumentSection(req, res, req.query.projectId, documentSchema._id);
                            }
                        });
                    }
                }
            } else {
                res.json(
                    responseGenerator(-1, "Unable to Uploaded Document", req.files)
                );
            }
        });
    } catch (e) {
        console.log(e);
    }
};

function updateDocumentSection(req, res, countryConfig_id, _id) {
    let dataModel = countryConfigModel;
    countryConfigModel.find({ _id: countryConfig_id }).then(data => {
        if(data.length<=0){
            dataModel=ruleConfigModel
        }
        //$push will append into array, $set will insert new array and remove old
        dataModel.findByIdAndUpdate(countryConfig_id, { $push: { documents: _id } }, { new: true }).populate({ path: "documents", options: { sort: { updated_at:-1}}}).then((data) => {
            res.json(responseGenerator(0, "Successfully Uploaded", data.documents[0]));
        }).catch(err => {
            throw new Error(err)
        })

    }).catch(err => {
       // console.log(err)
        res.json(
            responseGenerator(
                -1,
                "File Uploaded but unable to update Document Data",
                ""
            )
        );
    })


}

exports.createCountryConfig = (req, res) => {
    return countryConfigModel.create(req.body).then(data => {
        res.json(responseGenerator(0, "Successfully created country config", data));
    }).catch(err => {
        res.json(
            responseGenerator(-1, "Unable to  created country config", err)
        );
    })

}

exports.createRuleConfig = (req, res) => {
    return ruleConfigModel.create(req.body).then(data => {
        res.json(responseGenerator(0, "Successfully created country config", data));
    }).catch(err => {
        res.json(
            responseGenerator(-1, "Unable to  created country config", err)
        );
    })
}


exports.getAllConfig = (req, res) => {
     var finalResult={"countryConfig":"","ruleConfig":""}
    countryConfigModel.find({ createdBy: req.body.createdBy}).populate("documents").then(data => {
        finalResult.countryConfig = data
        ruleConfigModel.find({}).populate("documents").then(data=>{
            finalResult.ruleConfig = data
            res.json(responseGenerator(0, "Successfully getConfig", finalResult));
        }) 
    }).catch(err => {
        res.json(
            responseGenerator(-1, "Unable to  created country config", err)
        );
    })
}

