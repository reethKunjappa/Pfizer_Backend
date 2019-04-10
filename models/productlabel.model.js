var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var { DocumentSchema } = require("../models/document.model");

var ProductLabelSchema = new Schema({
  projectName: {
    type: String,
    unique: true,
    required: true
  },
  country: {
    type: Object,
    required: true
  },
  createdBy: {
    type: Object,
    required: true
  },
  createdOn: {
    type: Date
  },
  conflicts: {
    total: {
      type: Number,
      default: 0
    },
    types: {
      font: {
        type: Number,
        default: 0
      },
      order: {
        type: Number,
        default: 0
      },
      content: {
        type: Number,
        default: 0
      }
    },
    comments: []
  },
  documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]
});

module.exports = mongoose.model("ProductLabel", ProductLabelSchema);
