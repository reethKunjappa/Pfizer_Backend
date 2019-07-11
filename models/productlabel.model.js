var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var { DocumentSchema } = require("../models/document.model");
var ConflictCommentSchema = require("../models/conflict.model");

var ProductLabelSchema = new Schema({
  projectName: {
    type: String,
    required: true
  },
  country: {
    type: Object,
    required: true
  },
  proprietaryName:{
    type:String,
    required:true
  },
  createdBy: {
    type: Object,
    required: true
  },
  createdOn: {
    type: Date
  },
  conflicted: {
    type: Boolean,
    default: false
  },
  conflicts: {
    total: {
      type: Number,
      default: 0
    },
    types:[],
  
  },
  modifiedDate:{
      type:Date,
      default: Date.now
  },
  documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]
}, {
    timestamps: true
  });
// Making candidate key projName+country
ProductLabelSchema.index({ projectName: 1, country: 1}, { unique: true });
module.exports = mongoose.model("ProductLabel", ProductLabelSchema);
