var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CheckListSchema = new Schema({
    
    project_id:{
        type:String,
        required: true
    },
    file_id:{
        type:String,
        required: true
    },
    checks : []
});

module.exports = mongoose.model('CheckList_Statu', CheckListSchema);