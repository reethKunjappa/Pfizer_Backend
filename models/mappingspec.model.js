var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MappingspecCommentsSchema = new Schema({

    project_id: {
        type: Schema.Types.ObjectId,
        ref: 'ProductLabel'

    },
    label_file_id: {
        type: Schema.Types.ObjectId,
        ref: 'DocumentSchema'
    },
    reference_file_id: {
        type: Schema.Types.ObjectId,
        ref: 'DocumentSchema'
    },
    mapping_specs: [],

    _deleted: {
        type: Boolean,
        default: false
    },

}, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    });

module.exports = mongoose.model('Mapping', MappingspecCommentsSchema);


