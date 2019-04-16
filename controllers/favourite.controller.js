'use strict';
var Favourite = require('../models/favourite.model');
var Audit = require('../models/audit.model');
var _ = require('lodash');
const { responseGenerator } = require('../utility/commonUtils');


module.exports.create = function (req, res, next) {
    var fav = req.body;

    return Favourite.findOne(fav)
        .then(function (this_fav) {
            if (this_fav) {
                throw new Error("Favourite already exists");
            }
            return Favourite.create(fav)
        }).then(function (favourite) {
            return res.send({ result: favourite, status: { code: 0, message: "Marked Favourite" } });
        }).catch(function (err) {
            console.error(err);
            return res.send(responseGenerator(1, err.message, err));
        });
}

module.exports.getAll = function (req, res, next) {
    var query = req.body;
    return Favourite.find(query).populate('project').lean()
        .then(function (favourites) {
            favourites = _.map(favourites, function(fav){
                fav.project.favorite = true;
                return fav.project;
            })

            return res.send({ result: favourites, status: { code: 0, message: "Get Favourite" } });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}

module.exports.update = function (req, res, next) {
    var body = req.body;
    return Favourite.findById(req.params.id)
        .then(function (favourite) {
            if (!favourite) {
                throw new Error("No favourite found with the given _id");
            }
            favourite = _.extend(favourite, body);
            return favourite.save();
        }).then(function (fav) {
            return res.send({ result: fav });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}

module.exports.delete = function (req, res, next) {
    var query = req.body;
    return Favourite.findOneAndDelete(query).populate('project')
        .then(function (result) {
            var _project = result.project;
            result.project = _project._id;
             res.send({ result, status: { code: 0, message: "UnMarked Favourite" } });
            var audit = {
                user: result.user,
                project: _project,
                actionType: 'UNFAVOURITE',
            }
            return Audit.create(audit);
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}

