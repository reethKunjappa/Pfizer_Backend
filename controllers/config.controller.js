var mongoose = require("mongoose");
//mongoose.set('debug', true);
var { DocumentSchema } = require("../models/model");
var countryConfigModel = require("../models/countryConfig.model");
var ruleConfigModel = require("../models/rulesConfig.model");
const { responseGenerator } = require("../utility/commonUtils");
const appConfig = require("../config/appConfig");
var { mkdir, inputValidator, log } = require("../utility/commonUtils");
const { logMessage } = require("../config/appConfig");
var uuid = require("uuid-v4");
var _ = require("lodash");
var path = require("path");
var basePath = path.resolve("./");
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

exports.configFileUpload = function(req, res) {
  try {
    fileUploadPath = appConfig["FS_PATH"];
    fileVirtualPath = appConfig["DOCUMENT_VIEW_PATH"];
    function createUUID() {
      return (documentId = uuid());
    }
    var id = createUUID();
    fileUploadPath = fileUploadPath + "/" + id;
    mkdir(fileUploadPath);

    upload(req, res, function(err) {
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
            documentSchema.pdfPath = {
              location: path.resolve(
                basePath,
                req.files[i].destination,
                req.files[i].filename
              ),
              destination:
                fileVirtualPath + "/" + documentId + "/" + file[i].originalname
            };
            documentSchema.save(function(err) {
              if (err) {
                res.json(
                  responseGenerator(
                    -1,
                    "File Uploaded but unable to update Document Data",
                    ""
                  )
                );
              } else {
                updateDocumentSection(
                  req,
                  res,
                  req.query.projectId,
                  documentSchema._id
                );
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
  countryConfigModel
    .find({ _id: countryConfig_id })
    .then(data => {
      if (data.length <= 0) {
        dataModel = ruleConfigModel;
      }
      //$push will append into array, $set will insert new array and remove old
      dataModel
        .findByIdAndUpdate(
          countryConfig_id,
          { $push: { documents: _id } },
          { new: true }
        )
        .populate({ path: "documents", options: { sort: { updated_at: -1 } } })
        .then(data => {
          res.json(
            responseGenerator(0, "Successfully Uploaded", data.documents[0])
          );
        })
        .catch(err => {
          throw new Error(err);
        });
    })
    .catch(err => {
      // console.log(err)
      res.json(
        responseGenerator(
          -1,
          "File Uploaded but unable to update Document Data",
          ""
        )
      );
    });
}

exports.createCountryConfig = (req, res) => {
  return countryConfigModel
    .create(req.body)
    .then(data => {
      res.json(
        responseGenerator(0, "Successfully created country config", data)
      );
    })
    .catch(err => {
      res.json(responseGenerator(-1, "Unable to create country config", err));
    });
};

exports.createRuleConfig = (req, res) => {
  return ruleConfigModel
    .create(req.body)
    .then(data => {
      res.json(
        responseGenerator(0, "Successfully created country config", data)
      );
    })
    .catch(err => {
      res.json(responseGenerator(-1, "Unable to create country config", err));
    });
};

exports.getAllConfig = (req, res) => {
  var finalResult = { countryConfig: "", ruleConfig: "" };
  countryConfigModel
    .find({ createdBy: req.body.createdBy })
    .populate("documents")
    .then(data => {
      finalResult.countryConfig = data;
      ruleConfigModel
        .find({})
        .populate("documents")
        .then(data => {
          finalResult.ruleConfig = data;
          res.json(responseGenerator(0, "Successfully getConfig", finalResult));
        });
    })
    .catch(err => {
      res.json(responseGenerator(-1, "Unable to  get country config", err));
    });
};

exports.getPythonPayload = countryName => {
  if (_.isEmpty(countryName)) return [];

  return new Promise((resolve, reject) => {
    ruleConfigModel
      .aggregate([
        {
          $match: {
            $or: [
              { "rulesApplication.country.name": countryName },
              { "rulesApplication.global": true }
            ]
          }
        },
        { $unwind: "$rulesApplication" },
        {
          $match: {
            $or: [
              { "rulesApplication.country.name": countryName },
              { "rulesApplication.global": true }
            ]
          }
        },
        {
          $project: {
            ruleName: "$rulesSetup.ruleName",
            ruleDescription: "$rulesSetup.ruleDescription",
            comments: "$action.comments",
            allSections: "$rulesApplication.allSections",
            sections: "$rulesApplication.sections.value",
            section_selection: "$rulesApplication.sections.condition",
            conflictType: "$action.conflictType",
            additionalInformation: "$additionalInformation.addInfo",
            exceptionData: 1,
            documents: 1,
            _id: 0
          }
        },
        {
          $lookup: {
            from: "documentschemas",
            localField: "documents",
            foreignField: "_id",
            as: "rule_filepath"
          }
        }
      ])
      .then(rule => {
        console.log("Rule config: ", rule);
        rule.forEach(function(data, index) {
          if (rule[index]["documents"].length != 0) {
            delete rule[index]["documents"];
            rule[index].rule_filepath =
              rule[index].rule_filepath[0].pdfPath.location;
          } else {
            delete rule[index]["documents"];
            rule[index].rule_filepath = "";
          }
        });
        resolve(rule);
      })
      .catch(err => {
        console.log(err.message);
        reject([]);
        /*  res.json(
                    responseGenerator(-1, "Unable to  get pythonPyload data", err)
                ); */
      });
  });
};

exports.deleteConfig = (req, res) => {
  try {
    let inputValidationFields = {
      _id: "required",
      configType: "required"
    };
    inputValidator(req.body, inputValidationFields)
      .then(result => {
        if (!result.isValid) {
          throw result.message;
        }
      })
      .then(() => {
        if (req.body.configType == "Country") {
          countryConfigModel.deleteOne({ _id: req.body._id }).then(rule => {
            return res.json(
              responseGenerator(
                0,
                "Successfully deleted country config: ",
                req.body
              )
            );
          });
        } else {
          ruleConfigModel.deleteOne({ _id: req.body._id }).then(rule => {
            return res.json(
              responseGenerator(
                0,
                "Successfully deleted rule config: ",
                req.body
              )
            );
          });
        }
      })
      .catch(err => {
        log.error({ err: err }, logMessage.validatationerror);
        res.json(responseGenerator(-1, "Mandatory fields Missed", ""));
      });
  } catch (err) {
    log.error({ err: err }, logMessage.unhandlederror);
    res.json(responseGenerator(-1, "Something went wrong", ""));
  }
};
exports.updateRuleConfig = (req, res) => {
  try {
    let inputValidationFields = {
      _id: "required"
    };
    inputValidator(req.body, inputValidationFields)
      .then(result => {
        if (!result.isValid) {
          throw result.message;
        }
      })
      .then(() => {
        ruleConfigModel
          .findByIdAndUpdate(
            { _id: req.body._id },
            { $set: req.body },
            { upsert: true, new: true }
          )
          .populate("documents")
          .then(rule => {
            return res.json(
              responseGenerator(0, "Successfully updated rules: ", rule)
            );
          });
      })
      .catch(err => {
        log.error({ err: err }, logMessage.validatationerror);
        res.json(responseGenerator(-1, "Mandatory fields Missed", err));
      });
  } catch (err) {
    log.error({ err: err }, logMessage.unhandlederror);
    res.json(responseGenerator(-1, "Something went wrong", ""));
  }
};
