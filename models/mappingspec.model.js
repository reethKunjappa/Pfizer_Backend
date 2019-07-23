var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mappingSpec = new Schema({

    final_df:[],
    project_id:String,
    file_id:String

}, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    });

module.exports = mongoose.model('mappingspec', mappingSpec);


