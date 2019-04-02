var jwt = require('jsonwebtoken');
var config = require('../config/database');
const { ProductLabel, DocumentSchema } = require('../models/model');
const { responseGenerator } = require('../utility/commonUtils');
var { mkdir } = require('../utility/commonUtils');
var http = require('http');

exports.newProject = function (req, res) {
    var productLabel = new ProductLabel();
    var conflicts =  {
        number: 0,
        types: {
            fontConflicts: 0,
            contentConflicts: 0,
            orderConflicts: 0,
        }};
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
        ProductLabel.find({}).sort({modifiedDate: 'desc'}).exec(function (err, projects) {
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
    try {
        var compareRequest = [];
        var LPD_Document = null;
        ProductLabel.findOne({ _id: req.body._id }).populate('documents').exec(function (err, project) {
            if (err)
                res.json(responseGenerator(-1, "Unable to fetch the Project details", err));
            else {
                if (project && project.documents != null && project.documents.length > 0) {
                    project.documents.forEach(element => {
                        // console.log(element);
                        var fileData = { path: "", file_name: "", file_type: "", country_name: "" };
                        fileData.path = "/home/ubuntu/pfizer/pfizer-back-nodejs/fs/" + element.documentid;
                        fileData.file_name = element.documentName;
                        fileData.file_type = element.fileType;

                        // Getting the Document ID for Conflict Update
                        if (fileData.file_type == 'LPD') {
                            LPD_Document = element;
                        }
                        compareRequest.push(fileData);
                    });
                    // console.log(compareRequest);

                    const data = JSON.stringify(compareRequest);
                    const options = {
                        hostname: '13.233.129.104', // '127.0.0.1',
                        port: 5013,
                        path: '/conflict_retrieva                                               l',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                    // console.log(data);
                    const reqq = http.request(options, (resp) => {
                        var buffers = []
                        if (resp.statusCode == 200) {
                            resp.on('data', function (body) {
                                buffers.push(body)
                            }).on('end', function () {
                                var conflicts = JSON.parse(Buffer.concat(buffers).toString());
                                // console.log(LPD_Document);
                                console.log(conflicts);

                                if (conflicts) {
                                    var documentSchema = new DocumentSchema();
                                    documentSchema._id = LPD_Document._id;
                                    documentSchema.conflicts = conflicts;
                                    // console.log(LPD_Document);
                                    DocumentSchema.findByIdAndUpdate(LPD_Document._id, { $set: documentSchema }, {
                                        new: false
                                    }, function (err, request) {
                                        if (err) {
                                            res.json(responseGenerator(-1, "Unable to upload the conflict data", ""));
                                        } else {
                                            res.json(responseGenerator(0, "Successfully updated conflict data", conflicts));
                                        }
                                    });
                                    // res.json(responseGenerator(0, "Successfully retrieved Conflict details", conflicts, 0));
                                }

                            });
                        }

                    })

                    reqq.on('error', (error) => {
                        res.json(responseGenerator(-1, "Unable to fetch the Conflict details", err));
                    })

                    reqq.write(data)
                    reqq.end()
                }
                else{
                    res.json(responseGenerator(-1, "Unable to fetch the Project details", project));
                }
            }
        });

    } catch (e) {
        console.log(e);
    }
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
