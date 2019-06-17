var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Audit = require('../models/audit.model');
var project = require('../models/productlabel.model')
var FavouriteSchema = new Schema({
    project: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'ProductLabel'
    },
    user: {},
    markedOn: {
        type: Date,
        default: Date.now
    }
});

FavouriteSchema.post('save', function (doc) {
    var audit = {
        user: doc.user,
        project: doc.project,
        actionType: 'Mark Favourite',
        description: doc.project+' Added in Favourite List'
    }
    project.findById(doc.project,function(err,result){
        if(err) {
            console.log(err)
        }else{
            audit.project = result;
            audit.description = result.projectName+' Added in Favourite List'
            Audit.create(audit)
        }
    })
    
})


//module.exports = mongoose.model('Favourite', FavouriteSchema);
module.exports.FavouriteSchema = mongoose.model('FavouriteSchema', FavouriteSchema);