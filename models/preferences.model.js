var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PreferenceSchema = new Schema({
   user:{},
   countryPreferences:[]
},{
    timestamps:true
});

module.exports = mongoose.model('Preference', PreferenceSchema);
