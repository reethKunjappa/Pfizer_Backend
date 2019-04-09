var mongoose = require("mongoose");
const UserModel = require('../models/user.model');
const ProductlabelModel = require('../models/productlabel.model');
const SequenceNumber = require('../models/sequence.model');
const DocumentSchema = require('../models/document.model');
//const FavSchema = require('../models/favourite.model');

module.exports.User = mongoose.model("User");
module.exports.ProductLabel = mongoose.model("ProductLabel");
module.exports.DocumentSchema = mongoose.model("DocumentSchema");
//module.exports.FavSchema = mongoose.model("FavSchema");

module.exports.getModel = function (model) {
    return mongoose.model(model);
}

