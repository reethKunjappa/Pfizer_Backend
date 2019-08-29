/*  var jwt = require('jsonwebtoken');
var config = require('../config/database');
const { User } = require('../models/model');
const { responseGenerator } = require('../utility/commonUtils');

// Create user
exports.new = function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json(responseGenerator(-1, "Username and Password are mandatory !!"));
    } else {
        var user = new User();
        user.username = req.body.username;
        user.password = req.body.password;
        user.emailid = req.body.emailid;
        user.firstname = req.body.firstname;
        user.lastname = req.body.lastname;
        user.active = true;
        user.mobile = req.body.mobile;
        user.roles = req.body.roles;
        // save the contact and check for errors
        user.save(function (err) {
            user.password = "";
            if (err)
                res.json(responseGenerator(-1, "Unable to create user", err));

            res.json(responseGenerator(0, "Successfully created user", user));
        });
    }
};


// User Signin
exports.signin = function (req, res) {
    try {
        User.findOne({ username: req.body.username }).exec(function (err, user) {
            if (err)
                res.json(responseGenerator(-1, "Unable to signin. Please try after sometime", err));
            if (!user) {
                res.json(responseGenerator(-1, "Authentication failed. User not found.", ""));
            } else {
                // check if password matches
                user.comparePassword(req.body.password, function (err, isMatch) {
                    if (isMatch && !err) {
                        // if user is found and password is right create a token
                        var token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), data: user }, config.secret);
                        // return the information including token as JSON
                        user.password = "";
                        res.json(responseGenerator(0,  'JWT ' + token, user));
                    } else {
                        res.json(responseGenerator(-1, "Authentication failed. Wrong password.", ""));
                    }
                });
            }
        });
    } catch (e) {
        console.log(e);
    }

};

  */