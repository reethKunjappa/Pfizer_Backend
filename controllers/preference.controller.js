"use strict";
var Preference = require("../models/preferences.model");
var Promise = require("bluebird");
const { responseGenerator } = require("../utility/commonUtils");
var _ = require("lodash");

module.exports.getAllRules = (req, res, next) => {
  return Preference.find(req.body)
    .sort({ updated_at: -1 })
    .then(prefData => {
      console.log(prefData);
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
  Preference.deleteMany({}).then(()=>{
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
  }).catch(err=>{
        return resp.send(responseGenerator(1, err.message, err));
  })  
  
};

 
module.exports.updateRules = (req, res, next)=>{
  if (_.isEmpty(req.body))
    return res.send(responseGenerator(1, "Invalid body."));

  return Preference.find({
    "countryPreferences.countryName": req.body.countryPreferences.countryName
  })
    .lean()
    .then(function(prefData) {
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
    .then(function(data) {
      return Preference.findOne();
    })
    .then(function(resultData) {
      return res.send({
        result: resultData,
        status: { code: 0, message: "Preferences updated!" }
      });
    })
    .catch(function(err) {
      console.error(err);
      return res.status(400).send({ success: false, err: err.message });
    });
};
 
module.exports.deleteRules = (req,res,next)=>{
    if (_.isEmpty(req.body))
      return res.send(responseGenerator(1, "Invalid body."));
    Preference.deleteOne(req.body).then((data)=>{
        return res.send({
          result: data,
          status: { code: 0, message: "Successfully delted!" }
        });
    }).catch((err)=>{
        return res
          .status(400)
          .send({ success: false, err: err.message });
    })


}