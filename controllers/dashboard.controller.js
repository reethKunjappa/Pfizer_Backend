const { ProductLabel, DocumentSchema, ConflictComments } = require('../models/model');
const ConflictShcema =  require('../models/conflict.model')
const FavouriteSchema = require('../models/favourite.model')
const { responseGenerator, inputValidator, log } = require('../utility/commonUtils');
const v = require('node-input-validator');


exports.getAllProjects = function (req, res) {
    try {
        log.info("Get all projects api called");
        ProductLabel.find({}).exec(function (err, projects) {
            if (err)
                res.json(responseGenerator(-1, "Unable to retrieve Projects list", err));
            else
                res.json(responseGenerator(0, "Successfully retrieved Projects list", projects, ""));
        });
    } catch (e) {
        console.log(e);
    }
};

let modalNames = [{key:"projectCount",value: ProductLabel},
                {key:"documentsCount",value:DocumentSchema},
                {key:"totalConflictsCount",value:ConflictComments},
                {key:"favouritesCount",value:FavouriteSchema},
                {key:"conflict", value:ConflictShcema}
            ];
                
let getModalCount= function(modal,condition){
    return new Promise((resolve,rejected)=>{
        modal.countDocuments(condition, (err, count) => {
            if (err) {
                resolve(err);
            }
            resolve(count);
        })  
    })
}

let getModalAggregation = (modal,condition)=>{
    return new Promise((resolve,rejected)=>{
         modal.aggregate([
             { "$group": {
                 "_id": condition,
                 "count": { "$sum": 1 } 
             }}
         ], (err, data) => {
             if (err) {
                 resolve(err);
             }
             resolve(data);
             
         })
    })
     
}
exports.getCount = (req, res, next) => {
    log.info({req: req.body}, "dashboard function called");
    
        let responseObject = {
            projectCount: "",
            documentsCount: "",
            lastUploadedDocumentDate: "",
            lastConflictCreated:"",
            favouritesCount: "",
            totalConflictsCount: "",
            conflictTypeCount : "",
            documentsTypeCount : ""
        };

        try {
            let inputValidationFields = {
                userId: 'required',
            };
            inputValidator(req.body, inputValidationFields).then((result) => {
                if (!result.isValid) {
                    throw result.message;
                }
            }).then(() => {
                modalNames.forEach((element,index) =>{
                    getModalCount(element.value,{}).then((count)=>{
                        responseObject[element.key] = count
                    }).catch((err)=>{
                            
                    });
                    if(element.key == "documentsCount"||element.key == "totalConflictsCount"){

                        let type = "$conflict_type";
                        let propertyName = "conflictTypeCount"
                        if(element.key == "documentsCount"){
                            type = "$fileType";
                            propertyName = "documentsTypeCount"
                        }
                        getModalAggregation(element.value,type).then((data)=>{
                            responseObject[propertyName] = data;
                        }).catch((err)=>{

                        });
                    }
                
                })

                return DocumentSchema.find({}).sort({
                    uploadedDate: -1
                });

            }).then((result) => {
                responseObject.lastUploadedDocumentDate = result[0].uploadedDate;
               
            }).then(()=>{
                return  ConflictShcema.find({},{created_at:1,_id:0}).limit(1).sort({created_at:-1})
            })
            .then((result)=>{
                responseObject.lastConflictCreated = result[0].created_at;
                res.json(responseGenerator(0, "Successfully retrieved", responseObject, ""));
            })
            .catch((err) => {
                console.log(err);
                if (err instanceof TypeError) {
                    console.log(err);
                  } else {
                    console.log(err);
                  }
                return res.status(400).send({
                    success: false,
                    err: err
                });
            }).finally((e) => {
               
            })
        } catch (e) {
            console.log(e);
        }

}
