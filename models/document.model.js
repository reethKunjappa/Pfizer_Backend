var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DocumentSchema = new Schema({
    documentName: {
        type: String,
        required: true
    },
    documentid: {
        type: String,
        required: true,
        unique: true
    },
    mimetype: {
        type: String
    },
    destination: {
        type: String
    },
    projectId: {
        type: String
    },
    uploadedBy: {
        type: String
    },
    uploadedDate: {
        type: Date
    },
    location: {
        type: String
    },
    fileType: {
        type: String
    },
    version: {
        type: String
    },
    conflicts: {
        type: Array
    }
});

module.exports.DocumentSchema = mongoose.model('DocumentSchema', DocumentSchema);