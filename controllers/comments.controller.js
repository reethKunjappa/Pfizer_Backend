'use strict';
var Comments = require('../models/comments.model');
var _ = require('lodash');
const { responseGenerator } = require('../utility/commonUtils');


module.exports.createComments = function (req, res, next) {
    
    var comments = req.body;
    return Comments.create(comments)
    .then(function (comments) {
        return res.send({ result: comments, status: { code: 0, message: "Comment created!" } });
        }).catch(function (err) {
            console.error(err);
            return res.send(responseGenerator(1, err.message, err));
        });
};

module.exports.getAllComments = function (req, res, next) {
    var query = req.body;
    return Comments.find(query).populate('project').lean()
        .then(function (comments) {
            return res.send({ result: comments, status: { code: 0, message: "Get All Comments" } });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}


module.exports.updateComments = function (req, res, next) {
    var body = req.body;
    return Comments.findById(body._id)
        .then(function (comments) {
            if (!comments) {
                throw new Error("No comments found with the given _id");
            }
            comments = _.extend(comments, body, { commentedOn: Date.now()});
            return comments.save();
        }).then(function (result) {
            return res.send({ result, status: { code: 0, message: "Comment updated!" } });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}
/*
module.exports.deleteComments = function (req, res, next) {
    var query = req.body;
    return Comments.findOneAndDelete(query)
        .then(function (result) {
            return res.send({ result, status: { code: 0, message: "Comment deleted!" } });
        }).catch(function (err) {
            console.error(err);
            return res.status(400).send({ success: false, err: err.message });
        });
}
 */

 