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
<<<<<<< Updated upstream
    description: {}
}, {
        timestamps: true
    });
=======
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
>>>>>>> Stashed changes

module.exports = mongoose.model('Audit', AuditSchema);