var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var { DocumentSchema } = require("../models/document.model");

var CommentSchema = new Schema({
  text: {
    type: String,
  },
  type: {
    type: String,
  },
  referenceDoc: String,
  action: {
    type: String,
    enum: ['ACCEPT', 'REJECT']
  },
  actionBy: {},
  actionOn: {
    type: Date
  }
});

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
      spellCheck: {
        type: Number,
        default: 0
      },
    },
    comments: [CommentSchema]
  },
  documents: [{ type: mongoose.Schema.ObjectId, ref: DocumentSchema }]
}, {
    timestamps: true
  });

module.exports = mongoose.model("ProductLabel", ProductLabelSchema);
