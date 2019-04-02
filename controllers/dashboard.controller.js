const { ProductLabel } = require('../models/model');
const { responseGenerator } = require('../utility/commonUtils');

exports.getAllProjects = function (req, res) {
    try {
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