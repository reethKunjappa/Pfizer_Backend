"use strict";
var Preference = require("../models/preferences.model");
var Promise = require("bluebird");
const { responseGenerator, inputValidator } = require("../utility/commonUtils");
var _ = require("lodash");

module.exports.getAllRules = (req, res, next) => {
    return Preference.find(req.body)
        .sort({ updated_at: -1 })
        .then(prefData => {
            return res.send({
                result: prefData,
                status: { code: 0, message: "Get All Preferences" }
            });
        })
        .catch(err => {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
};

module.exports.addRules = (req, resp, next) => {
    if (_.isEmpty(req.body))
        return res.send(responseGenerator(1, "Invalid body."));
    Preference.deleteMany({}).then(() => {
        Preference.create(req.body)
            .then(res => {
                return resp.send({
                    result: res,
                    status: { code: 0, message: "Preferences created!" }
                });
            })
            .catch(err => {
                return resp.send(responseGenerator(1, err.message, err));
            });
    }).catch(err => {
        return resp.send(responseGenerator(1, err.message, err));
    })

};


module.exports.updateRules = (req, res, next) => {
    if (_.isEmpty(req.body))
        return res.send(responseGenerator(1, "Invalid body."));

    return Preference.find({
        "countryPreferences.countryName": req.body.countryPreferences.countryName
    })
        .lean()
        .then(function (prefData) {
            if (prefData.length < 1) {
                throw new Error("No Country found with the given country name");
            }
            const idToRemove = req.body.countryPreferences.countryName;
            var filteredCountry = prefData[0].countryPreferences.filter(
                item => item.countryName !== idToRemove
            );
            var updateCountryLangPref = _.concat(
                filteredCountry,
                req.body.countryPreferences
            );
            return Preference.findByIdAndUpdate(
                prefData[0]._id,
                {
                    $set: { countryPreferences: updateCountryLangPref }
                },
                { upsert: false }
            );
        })
        .then(function (data) {
            return Preference.findOne();
        })
        .then(function (resultData) {
            return res.send({
                result: resultData,
                status: { code: 0, message: "Preferences updated!" }
            });
        })
        .catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
};

module.exports.deleteRules = (req, res, next) => {
    if (_.isEmpty(req.body))
        return res.send(responseGenerator(1, "Invalid body."));

    let inputValidationFields = {
        p_id: "required",
        obj_id: "required"
    };
    inputValidator(req.body, inputValidationFields).then(result => {
        if (!result.isValid) {
            throw result.message;
        }
    }).then(() => {

        Preference.findByIdAndUpdate(
            { _id: req.body.p_id },
            {
                $pull: { details: { _id: req.body.obj_id } }
            },
            { multi: true }
        )
            .then(data => {
                return Preference.find()
                    .sort({ updated_at: -1 })
                    .then(prefData => {
                        console.log(prefData);
                        return res.send({
                            result: prefData,
                            status: {
                                code: 0,
                                message: "Get updated preferences"
                            }
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        return res
                            .status(400)
                            .send({
                                success: false,
                                err: err.message
                            });
                    });
            })
            .catch(err => {
                return res.status(400).send({ success: false, err: err.message });
            });
    }).catch((err) => {
        console.log(err)
        //log.error({ err: err }, logMessage.validatationerror);
        res.json(
            responseGenerator(-1, "Mandatory fields Missing", "")
        );
    })
}

exports.getRuleConfig = (countryName) => {

    if (_.isEmpty(countryName))
      return [];
    return new Promise((resolve,reject)=>{
        Preference.aggregate([
            { $match: { "details.country.name": countryName } },
            { $unwind: "$details" },
            { $match: { "details.country.name": countryName } },
            {
              $project: {
                ruleName: 1,
                action: 1,
                "details.sectionName": 1,
                "details.content": 1,
                "details.scope": 1,
                _id: 0
              }
            }
          ])
            .then(rule => {
                console.log("Rule config: ", rule)
             resolve(rule)
            })
            .catch(err => {
              console.log(err.message);
              reject([])
            });
   })
}