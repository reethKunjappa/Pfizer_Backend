var mongoose = require("mongoose");
//const UserModel = require('../models/user.model');
const ProductlabelModel = require('../models/productlabel.model');
const SequenceNumber = require('../models/sequence.model');
const DocumentSchema = require('../models/document.model');
//const FavouriteSchema = require('../models/favourite.model');
const ConflictComments = require('../models/conflict.model');

//module.exports.User = mongoose.model("User");
module.exports.ProductLabel = mongoose.model("ProductLabel");
module.exports.DocumentSchema = mongoose.model("DocumentSchema");
//module.exports.FavouriteSchema = mongoose.model("FavouriteSchema");
module.exports.ConflictComments = mongoose.model("conflicts");

module.exports.getModel = function (model) {
   // return mongoose.model(model);
}

