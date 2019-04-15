var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
        type: 'FAVOURITE',
        favId: doc._id
    }
    AuditSchema.create(audit)
})


module.exports = mongoose.model('Favourite', FavouriteSchema);