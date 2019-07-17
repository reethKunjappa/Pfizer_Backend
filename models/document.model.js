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
    pdfPath: {},
    mimetype: {
        type: String
    },
    destination: {
        type: String
    },
    projectId: {
        type: String
    },
    countryConfig_id:{
        type:String
    },
    uploadedBy: {
        type: Object
    },
    uploadedDate: {
        type: Date,
        default: new Date()
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
    labelCopy:{},
    originalPath :{},
    _deleted: {
        type: Boolean,
        default: false
    }
});

module.exports.DocumentSchema = mongoose.model('DocumentSchema', DocumentSchema);