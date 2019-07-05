var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PreferenceSchema = new Schema(
  [
    {
      ruleName: {
        type: String
      },
      action: {
        type: String
      },
      details: [
        {
          createdOn: {
            type: Date,
            default: new Date()
          },
          createdBy: {},
          country: [],
          sectionName:[],
          scope: String,
          content:[]
        }
      ]
    }
  ],
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model('Preference', PreferenceSchema);
