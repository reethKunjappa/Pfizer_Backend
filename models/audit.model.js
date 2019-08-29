var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AuditSchema = new Schema({
   user:{},
   //criteria:[],
   //match:[],
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
    description: String,
    comments:String,
    modifiedDate:{
        type:Date,
        default: Date.now
    }
},

{
    timestamps:true
});

module.exports = mongoose.model('Audit', AuditSchema);