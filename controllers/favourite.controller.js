'use strict';
var Favourite = require('../models/favourite.model');
var _ = require('lodash');

module.exports.create = function (req, res, next) {
    var fav = req.body;
    return Favourite.create(fav)
        .then(function (favourite) {
            return res.send({ result: favourite });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}

module.exports.getAll = function (req, res, next) {
    var query = req.body;
    return Favourite.find(query).populate('project')
        .then(function (favourites) {
            return res.send({ result: favourites });
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
    return Favourite.findOneAndDelete(query)
        .then(function (result) {
            return res.send({ result });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}

