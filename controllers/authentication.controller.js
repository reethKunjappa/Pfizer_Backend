var jwt = require('jsonwebtoken');
var config = require('../config/database');
const { User } = require('../models/model');
const { responseGenerator, inputValidator, log } = require('../utility/commonUtils');
const { logMessage } = require('../config/appConfig');

// Create user
exports.new = function (req, res) {

 try {
        let inputValidationFields = {
            username: 'required|string',
            firstname: 'required|string',
            lastname: 'required|string',
            access: 'required|array'
        };
        inputValidator(req.body, inputValidationFields).then((result) => {
            if (!result.isValid) {
                throw result.message;
            }
        }).then(() => {
            var user = new User();
            user.username = req.body.username;
            user.password = "Admin";
            user.firstname = req.body.firstname;
            user.lastname = req.body.lastname;
            user.access = req.body.access;
            // save the contact and check for errors
            user.save(function(err) {
                user.password = "";
                if (err) return res.json(responseGenerator(-1, "User "+req.body.username+" exist, Please try with diffrent username!", err.errmsg));

                return res.json(responseGenerator(0, "Successfully created user", user));
            });
        }).catch((err) => {
            log.error({ err: err }, logMessage.validatationerror);
            res.json(responseGenerator(-1, "Mandatory fields|type are missing", ""));
        })
    }catch (err) {
        log.error({ err: err }, logMessage.unhandlederror);
        res.json(responseGenerator(-1, "Something went wrong"));
    }   
}


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
