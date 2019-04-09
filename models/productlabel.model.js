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
    total: { type: Number },
    types: {
      font: Number,
      order: Number,
      content: Number
    },
    comments: []
  },
  documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]
});

module.exports = mongoose.model("ProductLabel", ProductLabelSchema);
