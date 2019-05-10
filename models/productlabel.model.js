var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var { DocumentSchema } = require("../models/document.model");
var ConflictCommentSchema = require("../models/conflict.model");

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
  conflicted: {
    type: Boolean,
    default: false
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
      },
      spell_grammar: {
        type: Number,
        default: 0
      },
    },
     // comments:[]
      //comments: [{ type: mongoose.Schema.ObjectId, ref: ConflictCommentSchema }]
  },
  documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]
}, {
    timestamps: true
  });

module.exports = mongoose.model("ProductLabel", ProductLabelSchema);
