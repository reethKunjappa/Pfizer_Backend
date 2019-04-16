var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AuditSchema = new Schema({
    user: {},
    project: {
        _id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'ProductLabel'
        },
        projectName: String
    },
    actionType: {
        type: String
    },
    description: {}
}, {
        timestamps: true
    });

module.exports = mongoose.model('Audit', AuditSchema);