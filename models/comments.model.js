/* var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentsSchema = new Schema({
    
    projectId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'ProductLabel'
    },
    commentedBy:{},

    commentedText:{
        type:String,
        required: true
    },
    commentedOn:{
        type:Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Comments', CommentsSchema); */