var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var { DocumentSchema } = require('./document.model');
var ProductSchema = require('./productlabel.model');

var CommentsSchema = new Schema({
    recommendations: {},
    comment_text: {
        type: String
    },
    conflict_type: {
        type: String
    },
    comment_id: {
        type: String
    },
    reference_doc: {
        type: String
    },
    start_index: {
        type: Number
    },
    end_index: {
        type: Number
    },
    index: {
        type: Number
    },
    document_id: { type: String },
    target_text: {
        type: String
    },
    project_id: { type: String },
    action: {
        type: String
    },
    action_on: {
        type: Date
    },
    action_by: {
    },
    _deleted: {
        type: Boolean,
        default: false

    }
}, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        strict : false
    });

module.exports = mongoose.model('conflicts', CommentsSchema);