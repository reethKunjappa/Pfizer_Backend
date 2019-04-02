var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SequenceNoSchema = new Schema({
    sequencetype: {
        type: String,
        unique: true
    },
    sequenceno: {
        type: Number,
        required: false
    }
});

module.exports = mongoose.model('SequenceNumber', SequenceNoSchema);