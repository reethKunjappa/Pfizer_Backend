var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AuditSchema = new Schema({
   user:{},
   project: {
_id:{
           type: Schema.Types.ObjectId,
           ref: 'ProductLabel'
    },
        projectName:String
    },
    actionType:{
        type:String
    },
    description:{
        _id:{
            type:Schema.Types.ObjectId,
        },
        documentName: String,
        fileType:String
    },
    comments:{},
},{
    timestamps:true
});

module.exports = mongoose.model('Audit', AuditSchema);