var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MappingspecCommentsSchema = new Schema({

        project_id: {
            type:Schema.Types.ObjectId,
            ref: 'ProductLabel'

        },
        label_file_id: {
            type: Schema.Types.ObjectId,
            ref: 'DocumentSchema'
        },
        reference_file_id:{
            type:Schema.Types.ObjectId,
            ref:'DocumentSchema'
        },
        mapping_specs:[],
    

});

module.exports = mongoose.model('Mapping', MappingspecCommentsSchema);


