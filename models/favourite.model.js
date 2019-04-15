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


module.exports = mongoose.model('Favourite', FavouriteSchema);