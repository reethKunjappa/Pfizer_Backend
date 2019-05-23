'use strict';
var  Preference  = require('../models/preferences.model');
var Promise = require('bluebird');
const { responseGenerator } = require('../utility/commonUtils');
var _ = require('lodash');


module.exports.preferencesCreate = function (req, resp, next) {
    
      if(_.isEmpty(req.body))
       return res.send(responseGenerator(1, "Invalid body."));
 
        Preference.findOne()
        .then(function(res){
            if(res==null || res.length<1){
                return Preference.create(req.body)
                .then(function(res){
                    return resp.send({ result: res, status: { code: 0, message: "Preferences created!" } });
                })
                .catch(function(err){
                    return resp.send(responseGenerator(1, err.message, err));
                })
            }else{
                // Concat two JSON and remove dublicate Obj
                var result = _.concat(res.countryPreferences, req.body.countryPreferences);
                var bar = _.map(_.groupBy(result, function (f) {
                    return JSON.stringify(f);
                    }), function (gr) {
                        return gr[0];
                    }
                );
                Preference.findByIdAndUpdate(res._id, { 
                    $set: { countryPreferences:bar}}, {upsert:true})
                    .then(function(resUpdate){
                        Preference.findById(res._id)
                        .then(function(res){
                            return resp.send({ result: res, status: { code: 0, message: "Preferences created!" } });
                        })
                        .catch(function(err){
                            return resp.send(responseGenerator(1, err.message, err)); 
                        })
                        
                    })
                    .catch(function(err){
                        return resp.send(responseGenerator(1, err.message, err)); 
                    })
            }
        })  
        .catch(function(err){
            return resp.send(responseGenerator(1, err.message, err));
        })
}

module.exports.getAllPreferences = function (req, res, next) {
   
 
     return Preference.findOne()
        .then(function (prefData) {
            console.log(prefData)
            return res.send({ result: prefData, status: { code: 0, message: "Get All Preferences" } });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        }); 
}


module.exports.updatePreference = function (req, res, next) {
    if(_.isEmpty(req.body))
       return res.send(responseGenerator(1, "Invalid body."));  

    return  Preference.find({ "countryPreferences.countryName":req.body.countryPreferences.countryName}).lean()
        .then(function (prefData) {
            if (prefData.length<1) {
                throw new Error("No Country found with the given country name");
            }
            const idToRemove = req.body.countryPreferences.countryName;
            var  filteredCountry = prefData[0].countryPreferences.filter((item) => item.countryName !== idToRemove);
            var updateCountryLangPref = _.concat(filteredCountry,req.body.countryPreferences)
            return Preference.findByIdAndUpdate(prefData[0]._id, { 
                $set: { countryPreferences:updateCountryLangPref}}, {upsert:false})   
        })
         .then(function(data){
            return Preference.findOne();
        })
        .then(function (resultData) {
            return res.send({ result:resultData, status: { code: 0, message: "Preferences updated!" } });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}
